"use client"

import { useEffect, useState } from "react"

import { useTimerStore } from "@/stores/timer-store"
import { timerRemainingMs } from "@/types/timer"

/**
 * The countdown shown on screen. It re-derives the value from the main
 * process state on a short local interval, so a throttled or sleeping window
 * snaps back to the correct time instead of accumulating drift.
 */
export function useTimerRemaining(): { remainingMs: number; progress: number } {
  const state = useTimerStore((store) => store.state)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (state.status !== "running") return

    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [state.status, state.startedAt, state.durationMs])

  const remainingMs = timerRemainingMs(state, now)
  const progress = state.durationMs > 0 ? 1 - remainingMs / state.durationMs : 0

  return { remainingMs, progress: Math.min(1, Math.max(0, progress)) }
}
