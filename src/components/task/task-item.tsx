"use client"

import { useState, type ComponentType } from "react"
import { motion } from "framer-motion"
import { Check, MoreHorizontal, Pencil, Play, RotateCcw, Trash2 } from "lucide-react"

import { TaskCheckbox } from "@/components/task/task-checkbox"
import { TaskMeta } from "@/components/task/task-meta"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTaskStore } from "@/stores/task-store"
import { useTimerStore } from "@/stores/timer-store"
import { useUiStore } from "@/stores/ui-store"
import type { Project, Task } from "@/types/domain"

interface TaskAction {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  run: () => void
}

/**
 * One task row. Completing it pulses the checkbox and draws a strike-through
 * (plan.md §19); everything else stays quiet until you hover, focus or
 * right-click it. The same action list feeds both the "…" menu (keyboard
 * reachable) and the right-click menu.
 */
export function TaskItem({ task, project }: { task: Task; project: Project | null }) {
  const setCompleted = useTaskStore((state) => state.setCompleted)
  const remove = useTaskStore((state) => state.remove)
  const openTaskDialog = useUiStore((state) => state.openTaskDialog)
  const startTimer = useTimerStore((state) => state.start)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  /** Plan.md §11: attach the task to a fresh focus session. */
  const startFocus = () => {
    void startTimer({ phase: "focus", taskId: task.id })
  }

  const primaryActions: TaskAction[] = [
    ...(task.completed
      ? []
      : [{ id: "focus", label: "Start focus", icon: Play, run: startFocus }]),
    {
      id: "toggle",
      label: task.completed ? "Mark as not done" : "Mark as done",
      icon: task.completed ? RotateCcw : Check,
      run: () => void setCompleted(task.id, !task.completed),
    },
    {
      id: "edit",
      label: "Edit",
      icon: Pencil,
      run: () => openTaskDialog({ taskId: task.id }),
    },
  ]

  const deleteAction: TaskAction = {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    run: () => setConfirmDeleteOpen(true),
  }

  const row = (
    <div className="group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-accent/40 focus-within:bg-accent/40">
      <TaskCheckbox
        checked={task.completed}
        onCheckedChange={(checked) => void setCompleted(task.id, checked)}
        label={task.completed ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}
        className="mt-[3px]"
      />

      <button
        type="button"
        onClick={() => openTaskDialog({ taskId: task.id })}
        className={cn(
          "min-w-0 flex-1 rounded-md text-left transition-opacity duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          task.completed && "opacity-60"
        )}
      >
        <span className="relative inline-block max-w-full align-middle">
          <span
            className={cn(
              "block truncate text-sm transition-colors duration-200",
              task.completed && "text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scaleX: task.completed ? 1 : 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute left-0 top-[0.55em] h-px w-full origin-left bg-current text-muted-foreground"
          />
        </span>

        <TaskMeta task={task} project={project} className="mt-1" />
      </button>

      {task.completed ? null : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Start focus on “${task.title}”`}
          title="Start focus"
          onClick={startFocus}
          className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <Play className="size-3.5" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for “${task.title}”`}
            className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {primaryActions.map((action) => (
            <DropdownMenuItem key={action.id} onSelect={action.run}>
              <action.icon />
              {action.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={deleteAction.run}
          >
            <deleteAction.icon />
            {deleteAction.label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
        <ContextMenuContent>
          {primaryActions.map((action) => (
            <ContextMenuItem key={action.id} onSelect={action.run}>
              <action.icon />
              {action.label}
            </ContextMenuItem>
          ))}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={deleteAction.run}
          >
            <deleteAction.icon />
            {deleteAction.label}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{task.title}” and its focus history will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void remove(task.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
