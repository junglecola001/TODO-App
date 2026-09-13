import { create } from "zustand"

import { DEFAULT_SETTINGS } from "@/lib/constants"
import { messageOf } from "@/lib/errors"
import { getDesktopBridge, ipc } from "@/lib/ipc"
import { playSound } from "@/lib/sounds"
import type { TimerCompletionEvent, TimerPhase, TimerState } from "@/types/timer"

/**
 * A mirror of the main process timer. The renderer never counts down by
 * itself — `useTimerRemaining` derives the display value from this state and
 * the real clock.
 */
const INITIAL_STATE: TimerState = {
  phase: "focus",
  status: "idle",
  durationMs: DEFAULT_SETTINGS.focusMinutes * 60_000,
  startedAt: null,
  remainingMs: null,
  taskId: null,
  completedFocusCount: 0,
}

interface TimerStoreState {
  state: TimerState
  ready: boolean
  error: string | null

  /** Subscribes to main-process events. Returns an unsubscribe function. */
  init: (handlers?: { onCompleted?: (event: TimerCompletionEvent) => void }) => () => void
  start: (options?: { phase?: TimerPhase; taskId?: string | null }) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  reset: () => Promise<void>
  skip: () => Promise<void>
  setPhase: (phase: TimerPhase) => Promise<void>
  selectTask: (taskId: string | null) => Promise<void>
  clearError: () => void
}

export const useTimerStore = create<TimerStoreState>((set) => {
  const run = async (operation: () => Promise<TimerState>): Promise<boolean> => {
    set({ error: null })
    try {
      set({ state: await operation(), ready: true })
      return true
    } catch (error) {
      set({ error: messageOf(error) })
      return false
    }
  }

  return {
    state: INITIAL_STATE,
    ready: false,
    error: null,

    init: (handlers) => {
      const bridge = getDesktopBridge()
      if (!bridge) return () => undefined

      void run(() => bridge.timer.getState())

      const unsubscribeState = bridge.timer.onStateChanged((state) => {
        set({ state, ready: true })
      })
      const unsubscribeCompleted = bridge.timer.onCompleted((event) => {
        handlers?.onCompleted?.(event)
      })

      return () => {
        unsubscribeState()
        unsubscribeCompleted()
      }
    },

    start: async (options) => {
      if (await run(() => ipc.timer.start(options))) playSound("timerStart")
    },
    pause: () => run(() => ipc.timer.pause()),
    resume: async () => {
      if (await run(() => ipc.timer.resume())) playSound("timerStart")
    },
    reset: () => run(() => ipc.timer.reset()),
    skip: () => run(() => ipc.timer.skip()),
    setPhase: (phase) => run(() => ipc.timer.setPhase(phase)),
    selectTask: (taskId) => run(() => ipc.timer.selectTask(taskId)),

    clearError: () => set({ error: null }),
  }
})
