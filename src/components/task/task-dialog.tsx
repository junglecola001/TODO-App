"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"

import { DueDatePicker } from "@/components/task/due-date-picker"
import { PriorityPicker, ProjectPicker } from "@/components/task/task-pickers"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Priority } from "@/lib/constants"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

const MAX_ESTIMATED_POMODOROS = 20

/** Create or edit a task. Opened from a row, the sidebar, a shortcut or a page action. */
export function TaskDialog() {
  const { open, taskId, defaultProjectId } = useUiStore((state) => state.taskDialog)
  const close = useUiStore((state) => state.closeTaskDialog)

  const tasks = useTaskStore((state) => state.tasks)
  const createTask = useTaskStore((state) => state.create)
  const updateTask = useTaskStore((state) => state.update)
  const projects = useProjectStore((state) => state.projects)

  const task = taskId ? (tasks.find((item) => item.id === taskId) ?? null) : null

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("none")
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(0)
  const [saving, setSaving] = useState(false)

  // Reload the form each time the dialog opens, so it always reflects the task
  // it was opened for (or a blank new task).
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? "")
    setDescription(task?.description ?? "")
    setPriority(task?.priority ?? "none")
    setDueDate(task?.dueDate ?? null)
    setProjectId(task?.projectId ?? defaultProjectId ?? null)
    setEstimatedPomodoros(task?.estimatedPomodoros ?? 0)
    setSaving(false)
  }, [open, task, defaultProjectId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle || saving) return

    setSaving(true)
    const payload = {
      title: trimmedTitle,
      description: description.trim() || null,
      priority,
      dueDate,
      projectId,
      estimatedPomodoros,
    }

    const saved = task ? await updateTask(task.id, payload) : await createTask(payload)
    setSaving(false)

    if (!saved) {
      toast.error(useTaskStore.getState().error ?? "Unable to save the task.")
      return
    }

    close()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription className="sr-only">
            Title, priority, due date, project and estimated pomodoros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            aria-label="Task title"
            className="h-10 text-[15px]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <PriorityPicker value={priority} onChange={setPriority} />
            <DueDatePicker value={dueDate} onChange={setDueDate} />
            <ProjectPicker value={projectId} projects={projects} onChange={setProjectId} />

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Fewer estimated pomodoros"
                disabled={estimatedPomodoros === 0}
                onClick={() => setEstimatedPomodoros((value) => Math.max(0, value - 1))}
              >
                <Minus className="size-3.5" />
              </Button>
              <span
                className="w-9 text-center text-[13px] tabular text-muted-foreground"
                aria-label="Estimated pomodoros"
              >
                {estimatedPomodoros}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="More estimated pomodoros"
                disabled={estimatedPomodoros >= MAX_ESTIMATED_POMODOROS}
                onClick={() =>
                  setEstimatedPomodoros((value) => Math.min(MAX_ESTIMATED_POMODOROS, value + 1))
                }
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional details"
              className="min-h-[88px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {task ? "Save changes" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
