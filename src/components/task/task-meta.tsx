"use client"

import { CalendarDays, Timer } from "lucide-react"

import { ProjectIcon } from "@/components/layout/project-icon"
import { PriorityIcon } from "@/components/task/priority-icon"
import { accentPreset } from "@/lib/constants"
import { daysUntil, formatDueDate, isToday } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { Project, Task } from "@/types/domain"

/** The quiet second line of a task row: due date, project, pomodoro progress. */
export function TaskMeta({
  task,
  project,
  className,
}: {
  task: Task
  project: Project | null
  className?: string
}) {
  const dueDate = task.dueDate
  const overdue = dueDate !== null && !task.completed && daysUntil(dueDate) < 0

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground",
        className
      )}
    >
      {dueDate ? (
        <span
          className={cn(
            "inline-flex items-center gap-1",
            overdue && "text-red-500/90",
            !overdue && isToday(dueDate) && "text-foreground/75"
          )}
        >
          <CalendarDays className="size-3" strokeWidth={1.9} />
          {formatDueDate(dueDate)}
        </span>
      ) : null}

      {project ? (
        <span className="inline-flex items-center gap-1">
          <ProjectIcon
            name={project.icon}
            className="size-3"
            style={{ color: accentPreset(project.color).hex }}
          />
          {project.name}
        </span>
      ) : null}

      {task.estimatedPomodoros > 0 ? (
        <PomodoroDots actual={task.actualPomodoros} estimated={task.estimatedPomodoros} />
      ) : null}

      <PriorityIcon priority={task.priority} />
    </div>
  )
}

function PomodoroDots({ actual, estimated }: { actual: number; estimated: number }) {
  // Cap the dots so a large estimate does not turn the row into a chart.
  const shown = Math.min(estimated, 6)

  return (
    <span
      className="inline-flex items-center gap-1"
      title={`${actual} of ${estimated} pomodoros`}
    >
      <Timer className="size-3" strokeWidth={1.9} />
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: shown }).map((_, index) => (
          <span
            key={index}
            className={cn("size-1.5 rounded-full", index < actual ? "bg-primary" : "bg-border")}
          />
        ))}
      </span>
      {estimated > shown ? (
        <span className="tabular">
          {actual}/{estimated}
        </span>
      ) : null}
    </span>
  )
}
