"use client"

import { useMemo } from "react"
import { Check, ListTodo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { selectTodayTasks, sortTasks } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { useTaskStore } from "@/stores/task-store"
import { useTimerStore } from "@/stores/timer-store"

const MAX_OPTIONS = 8

/** Which task the current session belongs to (plan.md §11). */
export function FocusTaskPicker({ disabled }: { disabled?: boolean }) {
  const taskId = useTimerStore((store) => store.state.taskId)
  const selectTask = useTimerStore((store) => store.selectTask)
  const tasks = useTaskStore((store) => store.tasks)

  const options = useMemo(() => {
    const today = selectTodayTasks(tasks)
    const todayIds = new Set(today.map((task) => task.id))
    const rest = sortTasks(tasks.filter((task) => !task.completed && !todayIds.has(task.id)))
    return [...today, ...rest].slice(0, MAX_OPTIONS)
  }, [tasks])

  const current = taskId ? (tasks.find((task) => task.id === taskId) ?? null) : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="mx-auto max-w-full gap-2 font-normal text-muted-foreground"
          title={disabled ? "Pause the timer to change the task" : undefined}
        >
          <ListTodo className="size-3.5 shrink-0" />
          <span className="truncate">{current ? current.title : "No task selected"}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="center" className="w-72 p-1.5">
        <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Focus on
        </p>

        {options.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            No open tasks yet. Add one first.
          </p>
        ) : (
          <div className="flex flex-col">
            {options.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => void selectTask(task.id)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                {task.id === taskId ? <Check className="size-3.5 shrink-0 text-primary" /> : null}
              </button>
            ))}
          </div>
        )}

        {current ? (
          <>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => void selectTask(null)}
              className={cn(
                "w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors",
                "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              )}
            >
              Clear task
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
