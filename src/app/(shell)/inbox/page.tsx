"use client"

import { useMemo } from "react"
import { Inbox, Plus } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { TaskList, TaskListSkeleton } from "@/components/task/task-list"
import { Button } from "@/components/ui/button"
import { selectInboxTasks } from "@/lib/tasks"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

export default function InboxPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const status = useTaskStore((state) => state.status)
  const projects = useProjectStore((state) => state.projects)
  const openTaskDialog = useUiStore((state) => state.openTaskDialog)

  const inboxTasks = useMemo(() => selectInboxTasks(tasks), [tasks])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-8 py-10">
      <PageHeader
        title="Inbox"
        description={
          inboxTasks.length === 0
            ? "Anything without a date waits here."
            : `${inboxTasks.length} ${inboxTasks.length === 1 ? "task" : "tasks"} waiting to be planned.`
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
      ) : (
        <TaskList
          tasks={inboxTasks}
          projects={projects}
          emptyState={
            <EmptyState
              icon={Inbox}
              title="Inbox zero."
              description="Nothing is waiting to be planned."
            />
          }
        />
      )}
    </div>
  )
}
