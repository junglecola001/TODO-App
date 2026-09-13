"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { CalendarDays, CornerDownLeft, Flag, Inbox, Timer } from "lucide-react"
import { toast } from "sonner"

import { ProjectIcon } from "@/components/layout/project-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { accentPreset, PRIORITY_LABELS } from "@/lib/constants"
import { formatDueDate } from "@/lib/dates"
import { parseTaskInput } from "@/lib/parse-task-input"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

const HINT = "Try “Finish homework tomorrow”, “Practice piano !high #Music”, “Read ~2”."

/**
 * Ctrl+N capture field. It understands a small set of tokens (plan.md §9) and
 * previews what it recognised — but it never blocks: anything it does not parse
 * simply stays in the title.
 */
export function QuickAddDialog() {
  const open = useUiStore((state) => state.quickAddOpen)
  const close = useUiStore((state) => state.closeQuickAdd)

  const projects = useProjectStore((state) => state.projects)
  const createTask = useTaskStore((state) => state.create)

  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)

  const parsed = useMemo(() => parseTaskInput(value, projects), [value, projects])
  const project = projects.find((item) => item.id === parsed.projectId) ?? null
  const hasTokens =
    parsed.matched.dueDate ||
    parsed.matched.priority ||
    parsed.matched.project ||
    parsed.matched.estimatedPomodoros

  const handleOpenChange = (next: boolean) => {
    if (next) return
    setValue("")
    close()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const title = parsed.title.trim()
    if (!title || saving) return

    setSaving(true)
    const task = await createTask({
      title,
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      projectId: parsed.projectId,
      estimatedPomodoros: parsed.estimatedPomodoros,
    })
    setSaving(false)

    if (!task) {
      toast.error(useTaskStore.getState().error ?? "Unable to save the task.")
      return
    }

    // The dialog closes immediately, so say where the task landed.
    toast.success(
      parsed.dueDate ? `Added to ${formatDueDate(parsed.dueDate)}` : "Added to Inbox",
      { description: task.title }
    )

    setValue("")
    close()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl gap-3 p-4">
        <DialogHeader>
          <DialogTitle className="text-sm">Add task</DialogTitle>
          <DialogDescription className="sr-only">
            Type a task. Dates, priority, project and pomodoro estimates are recognised as you type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Finish math homework"
            aria-label="Task"
            className="h-11 border-0 px-0 text-base shadow-none focus-visible:ring-0"
          />

          {value.trim() ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {parsed.dueDate ? (
                <Chip icon={<CalendarDays className="size-3" />}>{formatDueDate(parsed.dueDate)}</Chip>
              ) : (
                <Chip icon={<Inbox className="size-3" />}>Inbox</Chip>
              )}
              {parsed.matched.priority ? (
                <Chip icon={<Flag className="size-3" />}>{PRIORITY_LABELS[parsed.priority]}</Chip>
              ) : null}
              {project ? (
                <Chip
                  icon={
                    <ProjectIcon
                      name={project.icon}
                      className="size-3"
                      style={{ color: accentPreset(project.color).hex }}
                    />
                  }
                >
                  {project.name}
                </Chip>
              ) : null}
              {parsed.matched.estimatedPomodoros ? (
                <Chip icon={<Timer className="size-3" />}>
                  {parsed.estimatedPomodoros}{" "}
                  {parsed.estimatedPomodoros === 1 ? "pomodoro" : "pomodoros"}
                </Chip>
              ) : null}
              {!hasTokens ? <span className="text-muted-foreground">{HINT}</span> : null}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">{HINT}</p>
          )}

          <DialogFooter className="items-center gap-3 sm:justify-between">
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
              <Kbd>Enter</Kbd> to add · <Kbd>Esc</Kbd> to close
            </span>
            <Button type="submit" size="sm" disabled={!parsed.title.trim() || saving}>
              <CornerDownLeft className="size-3.5" />
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xs border border-border bg-muted/60 px-1.5 py-1 text-[11px] text-muted-foreground">
      {icon}
      {children}
    </span>
  )
}
