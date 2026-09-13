"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Pause, Play, X } from "lucide-react"

import { FocusFlowMark } from "@/components/brand/logo"
import { WindowControls } from "@/components/layout/window-controls"
import { TimerReadout } from "@/components/timer/timer-readout"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/stores/task-store"
import { useTimerStore } from "@/stores/timer-store"
import { useUiStore } from "@/stores/ui-store"

/**
 * Focus Mode (plan.md §12): everything except the clock, the task and the
 * transport control is covered by an overlay, so leaving it restores the exact
 * view you came from.
 */
export function FocusMode() {
  const active = useUiStore((store) => store.focusMode)
  const exitFocusMode = useUiStore((store) => store.exitFocusMode)
  const quickAddOpen = useUiStore((store) => store.quickAddOpen)
  const taskDialogOpen = useUiStore((store) => store.taskDialog.open)
  const projectDialogOpen = useUiStore((store) => store.projectDialog.open)

  const state = useTimerStore((store) => store.state)
  const start = useTimerStore((store) => store.start)
  const pause = useTimerStore((store) => store.pause)
  const resume = useTimerStore((store) => store.resume)

  const tasks = useTaskStore((store) => store.tasks)
  const currentTask = state.taskId ? (tasks.find((task) => task.id === state.taskId) ?? null) : null

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      // A dialog on top of focus mode should swallow Escape first.
      if (quickAddOpen || taskDialogOpen || projectDialogOpen) return
      exitFocusMode()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [active, exitFocusMode, quickAddOpen, taskDialogOpen, projectDialogOpen])

  const paused = state.status === "paused"
  const running = state.status === "running"

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="focus-mode"
          role="dialog"
          aria-modal="true"
          aria-label="Focus mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-40 flex flex-col bg-background"
        >
          {/* The window is frameless, so the controls stay reachable — quietly. */}
          <div className="drag-region flex h-11 shrink-0 items-center justify-end pr-1.5">
            <div className="flex items-center gap-0.5 opacity-30 transition-opacity duration-200 hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-sm"
                className="no-drag"
                aria-label="Exit focus mode"
                onClick={exitFocusMode}
              >
                <X className="size-4" />
              </Button>
              <WindowControls />
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-9 pb-28">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.04 }}
            >
              <TimerReadout size="focus" />
            </motion.div>

            <p className="max-w-md truncate px-6 text-center text-sm text-muted-foreground">
              {currentTask ? currentTask.title : "No task selected"}
            </p>

            <Button
              size="lg"
              className="min-w-32"
              onClick={() => void (running ? pause() : paused ? resume() : start())}
            >
              {running ? (
                <>
                  <Pause className="size-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  {paused ? "Resume" : "Start"}
                </>
              )}
            </Button>
          </div>

          <div className="pb-6 text-center">
            <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground/70">
              <FocusFlowMark className="size-3.5" />
              FocusFlow
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
