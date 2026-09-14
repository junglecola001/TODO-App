import { BrowserWindow } from "electron"

import { IPC } from "@/lib/ipc-channels"
import { DEFAULT_SETTINGS } from "@/lib/constants"
import type { TimerCompletionEvent, TimerPhase, TimerState } from "@/types/timer"

import { notifyPhaseComplete } from "../notifications"
import { createSession } from "../db/repositories/session-repository"
import { readRawSetting, readSettings, writeRawSetting } from "../db/repositories/settings-repository"
import { getTask, incrementTaskPomodoros } from "../db/repositories/task-repository"

const TICK_MS = 250
const PERSISTED_STATE_KEY = "timer_state"
const DEFAULT_LONG_BREAK_INTERVAL = 4

interface PersistedTimerState {
  phase: TimerPhase
  status: string
  remainingMs: number
  taskId: string | null
  completedFocusCount: number
}

/**
 * The Pomodoro engine (plan.md §10).
 *
 * It never counts down a number: the remaining time is always derived from
 * `startedAt` + `durationMs` against the real clock, so throttled timers,
 * sleeping machines and hidden windows cannot make it drift. `setInterval` is
 * only used to notice that the phase is over.
 *
 * It lives in the main process so it keeps running when the window is hidden to
 * the tray, and it owns the side effects of finishing: session rows, task
 * pomodoro counts and Windows notifications.
 */
class TimerService {
  /**
   * Seeded from the compiled-in defaults, not from the settings table: this
   * module is evaluated while `main.ts` is still being loaded, which is before
   * `app.whenReady()` has opened the database. `restore()` — the first thing
   * that runs once the database is ready — swaps in the user's real durations.
   */
  private state: TimerState = {
    phase: "focus",
    status: "idle",
    durationMs: minutesToMs(DEFAULT_SETTINGS.focusMinutes),
    startedAt: null,
    remainingMs: null,
    taskId: null,
    completedFocusCount: 0,
  }
  /** Real start of the current phase; stays fixed across pause/resume. */
  private phaseStartedAt: number | null = null
  private ticker: NodeJS.Timeout | null = null
  private listeners = new Set<(state: TimerState) => void>()

  getState(): TimerState {
    return { ...this.state }
  }

  /**
   * Notified on every transition (not on every tick). The tray uses this to
   * keep its menu and tooltip in step with the timer.
   */
  onChange(listener: (state: TimerState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  start(options: { phase?: TimerPhase; taskId?: string | null } = {}): TimerState {
    const phase = options.phase ?? this.state.phase
    const taskId = options.taskId !== undefined ? options.taskId : this.state.taskId
    this.begin(phase, taskId, this.state.completedFocusCount)
    return this.getState()
  }

  pause(): TimerState {
    if (this.state.status !== "running") return this.getState()

    this.stopTicker()
    this.state = {
      ...this.state,
      status: "paused",
      remainingMs: this.remaining(),
      startedAt: null,
    }
    this.changed()
    return this.getState()
  }

  resume(): TimerState {
    if (this.state.status !== "paused") return this.getState()

    const remaining = this.state.remainingMs ?? this.state.durationMs
    // Rebuild `startedAt` so the single remaining-time formula keeps working.
    const startedAt = Date.now() - (this.state.durationMs - remaining)

    this.state = { ...this.state, status: "running", startedAt, remainingMs: null }
    this.startTicker()
    this.changed()
    return this.getState()
  }

  /** Back to a full, idle phase. */
  reset(): TimerState {
    this.stopTicker()
    this.phaseStartedAt = null
    this.state = this.idleState(this.state.phase, this.state.taskId, this.state.completedFocusCount)
    this.changed()
    return this.getState()
  }

  /**
   * Move to the next phase without recording anything — skipping a focus
   * session must not count as a finished pomodoro.
   */
  skip(): TimerState {
    const next: TimerPhase = this.state.phase === "focus" ? "short_break" : "focus"
    this.stopTicker()
    this.phaseStartedAt = null
    this.state = this.idleState(next, this.state.taskId, this.state.completedFocusCount)
    this.changed()
    return this.getState()
  }

  setPhase(phase: TimerPhase): TimerState {
    this.stopTicker()
    this.phaseStartedAt = null
    this.state = this.idleState(phase, this.state.taskId, this.state.completedFocusCount)
    this.changed()
    return this.getState()
  }

  selectTask(taskId: string | null): TimerState {
    if (this.state.taskId === taskId) return this.getState()
    this.state = { ...this.state, taskId }
    this.changed()
    return this.getState()
  }

  /**
   * Picks the timer back up after a restart. A session that was running keeps
   * running only if it still has time left; an expired one is dropped rather
   * than recorded, because we cannot know whether the user was actually working
   * while the app was closed.
   */
  restore(): void {
    try {
      const raw = readRawSetting(PERSISTED_STATE_KEY)
      if (!raw) {
        this.refreshIdleState()
        return
      }

      const parsed = JSON.parse(raw) as Partial<PersistedTimerState>
      if (!isPhase(parsed.phase) || typeof parsed.remainingMs !== "number") {
        this.refreshIdleState()
        return
      }

      const durationMs = this.durationFor(parsed.phase)
      const remaining = Math.min(Math.max(0, parsed.remainingMs), durationMs)
      const taskId = typeof parsed.taskId === "string" ? parsed.taskId : null
      const completedFocusCount =
        typeof parsed.completedFocusCount === "number" ? parsed.completedFocusCount : 0

      if (parsed.status === "running" && remaining > 0) {
        const startedAt = Date.now() - (durationMs - remaining)
        this.phaseStartedAt = startedAt
        this.state = {
          phase: parsed.phase,
          status: "running",
          durationMs,
          startedAt,
          remainingMs: null,
          taskId,
          completedFocusCount,
        }
        this.startTicker()
      } else if (parsed.status === "paused" && remaining > 0) {
        this.state = {
          phase: parsed.phase,
          status: "paused",
          durationMs,
          startedAt: null,
          remainingMs: remaining,
          taskId,
          completedFocusCount,
        }
      } else {
        this.state = this.idleState(parsed.phase, taskId, completedFocusCount)
      }

      this.changed()
    } catch (error) {
      console.error("[focusflow] could not restore the timer state", error)
      writeRawSetting(PERSISTED_STATE_KEY, null)
    }
  }

  // ---------------------------------------------------------------- internals

  private begin(phase: TimerPhase, taskId: string | null, completedFocusCount: number): void {
    const durationMs = this.durationFor(phase)
    const startedAt = Date.now()

    this.phaseStartedAt = startedAt
    this.state = {
      phase,
      status: "running",
      durationMs,
      startedAt,
      remainingMs: null,
      taskId,
      completedFocusCount,
    }

    this.startTicker()
    this.changed()
  }

  private handleCompletion(): void {
    this.stopTicker()

    const { phase, durationMs, taskId } = this.state
    const completedAt = this.state.startedAt !== null ? this.state.startedAt + durationMs : Date.now()
    const startedAt = this.phaseStartedAt ?? completedAt - durationMs
    const taskTitle = taskId ? (getTask(taskId)?.title ?? null) : null

    // Record first: a failed notification must never lose a finished pomodoro.
    try {
      createSession({
        taskId,
        type: phase,
        startedAt,
        completedAt,
        duration: durationMs,
      })
      if (phase === "focus" && taskId) incrementTaskPomodoros(taskId)
    } catch (error) {
      console.error("[focusflow] could not record the finished session", error)
    }

    const completedFocusCount =
      phase === "focus" ? this.state.completedFocusCount + 1 : this.state.completedFocusCount

    const nextPhase: TimerPhase =
      phase === "focus"
        ? completedFocusCount % longBreakInterval() === 0
          ? "long_break"
          : "short_break"
        : "focus"

    notifyPhaseComplete(phase, taskTitle)

    const autoStart = readSettings().autoStartNextSession
    this.phaseStartedAt = null
    this.state = this.idleState(nextPhase, taskId, completedFocusCount)

    this.publishCompletion({
      phase,
      taskId,
      taskTitle,
      nextPhase,
      autoStarted: autoStart,
    })

    if (autoStart) {
      this.begin(nextPhase, taskId, completedFocusCount)
    } else {
      this.changed()
    }
  }

  private tick(): void {
    if (this.state.status !== "running") return
    if (this.remaining() <= 0) this.handleCompletion()
  }

  private remaining(): number {
    if (this.state.status === "running" && this.state.startedAt !== null) {
      return Math.max(0, this.state.durationMs - (Date.now() - this.state.startedAt))
    }
    return this.state.remainingMs ?? this.state.durationMs
  }

  /**
   * Re-derives an idle phase from the stored settings. Running this after the
   * database opens is what replaces the construction-time fallback duration
   * with whatever the user actually configured.
   */
  private refreshIdleState(): void {
    this.state = this.idleState(this.state.phase, this.state.taskId, this.state.completedFocusCount)
  }

  private idleState(
    phase: TimerPhase,
    taskId: string | null = null,
    completedFocusCount = 0
  ): TimerState {
    return {
      phase,
      status: "idle",
      durationMs: this.durationFor(phase),
      startedAt: null,
      remainingMs: null,
      taskId,
      completedFocusCount,
    }
  }

  private durationFor(phase: TimerPhase): number {
    const settings = readSettings()
    const minutes =
      phase === "focus"
        ? settings.focusMinutes
        : phase === "short_break"
          ? settings.shortBreakMinutes
          : settings.longBreakMinutes

    return minutesToMs(minutes)
  }

  private startTicker(): void {
    this.stopTicker()
    this.ticker = setInterval(() => this.tick(), TICK_MS)
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker)
      this.ticker = null
    }
  }

  private persist(): void {
    const snapshot: PersistedTimerState = {
      phase: this.state.phase,
      status: this.state.status,
      remainingMs: this.remaining(),
      taskId: this.state.taskId,
      completedFocusCount: this.state.completedFocusCount,
    }

    try {
      writeRawSetting(PERSISTED_STATE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.error("[focusflow] could not persist the timer state", error)
    }
  }

  private changed(): void {
    this.persist()
    const snapshot = this.getState()

    for (const listener of this.listeners) {
      try {
        listener(snapshot)
      } catch (error) {
        console.error("[focusflow] timer listener failed", error)
      }
    }

    this.broadcast(IPC.TimerStateChanged, snapshot)
  }

  private publishCompletion(event: TimerCompletionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getState())
      } catch (error) {
        console.error("[focusflow] timer listener failed", error)
      }
    }

    this.broadcast(IPC.TimerCompleted, event)
  }

  private broadcast(channel: string, payload: unknown): void {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send(channel, payload)
    }
  }
}

/** Clamped minutes to milliseconds, shared by the settings lookup and the fallback. */
function minutesToMs(minutes: number): number {
  return Math.max(1, Math.round(minutes)) * 60_000
}

function longBreakInterval(): number {
  const interval = readSettings().longBreakInterval
  return Number.isFinite(interval) && interval >= 2 ? Math.round(interval) : DEFAULT_LONG_BREAK_INTERVAL
}

function isPhase(value: unknown): value is TimerPhase {
  return value === "focus" || value === "short_break" || value === "long_break"
}

export const timerService = new TimerService()
