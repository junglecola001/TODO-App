"use client"

import { useMemo, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { TaskItem } from "@/components/task/task-item"
import { Skeleton } from "@/components/ui/skeleton"
import type { Project, Task } from "@/types/domain"

interface TaskListProps {
  tasks: Task[]
  projects: Project[]
  /** Rendered instead of the list when there is nothing to show. */
  emptyState?: ReactNode
}

export function TaskList({ tasks, projects, emptyState }: TaskListProps) {
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  )

  if (tasks.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout="position"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <TaskItem
              task={task}
              project={task.projectId ? projectsById.get(task.projectId) ?? null : null}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Shown while the first load is in flight. Deliberately the same shape as a
 * task row, so the list does not jump when the data arrives.
 */
export function TaskListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-0.5" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-2.5 py-2">
          <Skeleton className="mt-[3px] size-[18px] shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
