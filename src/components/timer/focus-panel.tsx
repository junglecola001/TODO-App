"use client"

import { Maximize2, Pause, Play, RotateCcw, SkipForward } from "lucide-react"

import { FocusTaskPicker } from "@/components/timer/focus-task-picker"
import { TimerReadout } from "@/components/timer/timer-readout"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useTimerRemaining } from "@/hooks/use-timer-remaining"
import { TIMER_PHASE_LABELS } from "@/lib/timer"
import { cn } from "@/lib/utils"
import { useTimerStore } from "@/stores/timer-store"
import { useUiStore } from "@/stores/ui-store"
import type { TimerPhase } from "@/types/timer"

const PHASES: TimerPhase[] = ["focus", "short_break", "long_break"]

/** The dashboard timer (plan.md §5): phases, clock, task, transport controls. */
export function FocusPanel({ className }: { className?: string }) {
  const state = useTimerStore((store) => store.state)
  const start = useTimerStore((store) => store.start)
  const pause = useTimerStore((store) => store.pause)
  const resume = useTimerStore((store) => store.resume)
  const reset = useTimerStore((store) => store.reset)
  const skip = useTimerStore((store) => store.skip)
  const setPhase = useTimerStore((store) => store.setPhase)
  const enterFocusMode = useUiStore((store) => store.enterFocusMode)

  const { progress } = useTimerRemaining()

  const running = state.status === "running"
  const paused = state.status === "paused"

  return (
    <section
      aria-label="Focus timer"
      className={cn("flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-soft", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-1">
          {PHASES.map((phase) => {
            const isActive = state.phase === phase
            return (
              <button
                key={phase}
                type="button"
                aria-pressed={isActive}
                onClick={() => void setPhase(phase)}
                className={cn(
                  "h-7 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {TIMER_PHASE_LABELS[phase]}
              </button>
            )
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={enterFocusMode}
        >
          <Maximize2 className="size-3.5" />
          Focus mode
        </Button>
      </div>

      <TimerReadout />

      <Progress value={progress * 100} aria-hidden />

      <FocusTaskPicker disabled={running || paused} />

      <div className="flex items-center justify-center gap-2">
        {running ? (
          <Button className="min-w-28" onClick={() => void pause()}>
            <Pause className="size-4" />
            Pause
          </Button>
        ) : (
          <Button
            className="min-w-28"
            onClick={() => void (paused ? resume() : start())}
          >
            <Play className="size-4" />
            {paused ? "Resume" : "Start"}
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          aria-label="Reset this phase"
          onClick={() => void reset()}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Skip to the next phase"
          onClick={() => void skip()}
        >
          <SkipForward className="size-4" />
        </Button>
      </div>
    </section>
  )
}
