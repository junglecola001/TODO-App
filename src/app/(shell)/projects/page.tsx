"use client"

import { useMemo } from "react"
import { FolderPlus, Pencil, Plus } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { resolveProjectIcon } from "@/components/layout/project-icon"
import { TaskList, TaskListSkeleton } from "@/components/task/task-list"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { sortTasks } from "@/lib/tasks"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

export default function ProjectsPage() {
  const projects = useProjectStore((state) => state.projects)
  const status = useProjectStore((state) => state.status)
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId)
  const tasks = useTaskStore((state) => state.tasks)
  const openTaskDialog = useUiStore((state) => state.openTaskDialog)
  const openProjectDialog = useUiStore((state) => state.openProjectDialog)

  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0] ?? null

  const { openTasks, completedCount, progress } = useMemo(() => {
    if (!project) return { openTasks: [], completedCount: 0, progress: 0 }

    const projectTasks = tasks.filter((task) => task.projectId === project.id)
    const completed = projectTasks.filter((task) => task.completed).length

    return {
      openTasks: sortTasks(projectTasks.filter((task) => !task.completed)),
      completedCount: completed,
      progress: projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100),
    }
  }, [project, tasks])

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-8 py-10">
        <PageHeader title="Projects" description="Group related work under one name." />
        {status === "loading" ? (
          <TaskListSkeleton rows={2} />
        ) : (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet."
            description="Create one to group tasks — a project can carry its own icon and color."
            action={
              <Button size="sm" onClick={() => openProjectDialog()}>
                <Plus className="size-3.5" />
                New project
              </Button>
            }
          />
        )}
      </div>
    )
  }

  const total = openTasks.length + completedCount

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-8 py-10">
      <PageHeader
        title={project.name}
        description={
          total === 0 ? "No tasks yet." : `${openTasks.length} open · ${completedCount} completed`
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => openProjectDialog(project.id)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button size="sm" onClick={() => openTaskDialog({ projectId: project.id })}>
              <Plus className="size-3.5" />
              Add task
            </Button>
          </>
        }
      />

      {total > 0 ? (
        <div className="flex flex-col gap-2 px-2.5">
          <Progress value={progress} aria-label={`${progress}% complete`} />
          <p className="text-[11px] tabular text-muted-foreground">{progress}% complete</p>
        </div>
      ) : null}

      <TaskList
        tasks={openTasks}
        projects={projects}
        emptyState={
          <EmptyState
            icon={resolveProjectIcon(project.icon)}
            title="Nothing here yet."
            description="Tasks you assign to this project will appear here."
          />
        }
      />
    </div>
  )
}
