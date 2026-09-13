"use client"

import { useMemo } from "react"
import { Plus, Sparkles } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { TaskList, TaskListSkeleton } from "@/components/task/task-list"
import { FocusPanel } from "@/components/timer/focus-panel"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useGreeting } from "@/hooks/use-greeting"
import { selectCompletedToday, selectTodayTasks } from "@/lib/tasks"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

export default function TodayPage() {
  const greeting = useGreeting()

  const tasks = useTaskStore((state) => state.tasks)
  const status = useTaskStore((state) => state.status)
  const projects = useProjectStore((state) => state.projects)
  const openTaskDialog = useUiStore((state) => state.openTaskDialog)

  const todayTasks = useMemo(() => selectTodayTasks(tasks), [tasks])
  const completedToday = useMemo(() => selectCompletedToday(tasks), [tasks])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-8 py-10">
      <PageHeader
        title={greeting || "Today"}
        description={summarize(todayTasks.length, completedToday.length)}
        actions={
          <Button variant="outline" size="sm" onClick={() => openTaskDialog()}>
            <Plus className="size-3.5" />
            Add task
          </Button>
        }
      />

      <FocusPanel />

      {status === "loading" ? (
        <TaskListSkeleton />
      ) : (
        <>
          <TaskList
            tasks={todayTasks}
            projects={projects}
            emptyState={
              <EmptyState icon={Sparkles} title="Nothing planned." description="Enjoy your day." />
            }
          />

          {completedToday.length > 0 ? (
            <section className="flex flex-col gap-1">
              <h2 className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Completed today · {completedToday.length}
              </h2>
              <TaskList tasks={completedToday} projects={projects} />
            </section>
          ) : null}

          <p className="flex flex-wrap items-center gap-1.5 px-2.5 text-[11px] text-muted-foreground">
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>N</Kbd>
            <span>to add a task without leaving the keyboard.</span>
          </p>
        </>
      )}
    </div>
  )
}

function summarize(open: number, completed: number): string | undefined {
  if (open === 0 && completed === 0) return undefined

  const parts: string[] = []
  if (open > 0) parts.push(open === 1 ? "1 task left" : `${open} tasks left`)
  if (completed > 0) parts.push(completed === 1 ? "1 done" : `${completed} done`)
  return parts.join(" · ")
}
