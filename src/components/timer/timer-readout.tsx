"use client"

import { useTimerRemaining } from "@/hooks/use-timer-remaining"
import { describeTimerClock, formatTimerClock, TIMER_PHASE_LABELS } from "@/lib/timer"
import { cn } from "@/lib/utils"
import { useTimerStore } from "@/stores/timer-store"

/** The clock itself: phase name on top, big tabular digits below. */
export function TimerReadout({
  size = "default",
  className,
}: {
  size?: "default" | "focus"
  className?: string
}) {
  const state = useTimerStore((store) => store.state)
  const { remainingMs } = useTimerRemaining()

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {TIMER_PHASE_LABELS[state.phase]}
      </p>
      <p
        role="timer"
        aria-label={describeTimerClock(remainingMs)}
        className={cn(
          "tabular font-semibold leading-none tracking-tight",
          size === "focus" ? "text-[88px]" : "text-[56px]",
          state.status === "paused" && "text-muted-foreground"
        )}
      >
        {formatTimerClock(remainingMs)}
      </p>
    </div>
  )
}
