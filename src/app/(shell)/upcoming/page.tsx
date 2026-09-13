"use client"

import { useMemo } from "react"
import { CalendarDays, Plus } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { TaskList, TaskListSkeleton } from "@/components/task/task-list"
import { Button } from "@/components/ui/button"
import { formatDueDate } from "@/lib/dates"
import { groupByDueDate, selectUpcomingTasks } from "@/lib/tasks"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

export default function UpcomingPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const status = useTaskStore((state) => state.status)
  const projects = useProjectStore((state) => state.projects)
  const openTaskDialog = useUiStore((state) => state.openTaskDialog)

  const groups = useMemo(() => groupByDueDate(selectUpcomingTasks(tasks)), [tasks])
  const total = useMemo(() => groups.reduce((sum, group) => sum + group.tasks.length, 0), [groups])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-8 py-10">
      <PageHeader
        title="Upcoming"
        description={
          total === 0
            ? "Scheduled work, grouped by day."
            : `${total} ${total === 1 ? "task" : "tasks"} scheduled.`
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => openTaskDialog()}>
            <Plus className="size-3.5" />
            Add task
          </Button>
        }
      />

      {status === "loading" ? (
        <TaskListSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled."
          description="Tasks with a due date show up here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-1">
              <h2 className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {formatDueDate(group.key)}
              </h2>
              <TaskList tasks={group.tasks} projects={projects} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
