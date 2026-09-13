import type { PomodoroType } from "@/types/domain"

/** Focus / short break / long break — the same three values the database stores. */
export type TimerPhase = PomodoroType

export type TimerStatus = "idle" | "running" | "paused"

/**
 * The timer lives in the main process so it keeps counting while the window is
 * hidden, and so the tray and notifications can read it.
 *
 * The renderer never stores a countdown of its own: it derives the remaining
 * time from `durationMs` and `startedAt` against the real clock (plan.md §10),
 * which is what makes the timer immune to drift and to background throttling.
 */
export interface TimerState {
  phase: TimerPhase
  status: TimerStatus
  /** Full length of the current phase, in milliseconds. */
  durationMs: number
  /** Epoch ms the current run segment began; null while idle or paused. */
  startedAt: number | null
  /** Remaining ms while paused; null while running or idle. */
  remainingMs: number | null
  /** Task this session is attached to, if any. */
  taskId: string | null
  /** Focus sessions completed in the current cycle, used for the long break. */
  completedFocusCount: number
}

export interface TimerCompletionEvent {
  /** The phase that just finished. */
  phase: TimerPhase
  taskId: string | null
  taskTitle: string | null
  /** What comes next. */
  nextPhase: TimerPhase
  /** True when the next phase started by itself (auto start is on). */
  autoStarted: boolean
}

export function timerRemainingMs(state: TimerState, now: number): number {
  if (state.status === "running" && state.startedAt !== null) {
    return Math.max(0, state.durationMs - (now - state.startedAt))
  }
  return state.remainingMs ?? state.durationMs
}
