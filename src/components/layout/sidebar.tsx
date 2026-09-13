"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, CalendarDays, Inbox, Plus, Settings, Sun } from "lucide-react"

import { NavItem } from "@/components/layout/nav-item"
import { ProjectIcon } from "@/components/layout/project-icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { accentPreset } from "@/lib/constants"
import { selectInboxTasks, selectTodayTasks } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"

export function Sidebar() {
  const pathname = usePathname()
  const tasks = useTaskStore((state) => state.tasks)
  const projects = useProjectStore((state) => state.projects)
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId)
  const selectProject = useProjectStore((state) => state.select)
  const openProjectDialog = useUiStore((state) => state.openProjectDialog)

  const todayCount = useMemo(() => selectTodayTasks(tasks).length, [tasks])
  const inboxCount = useMemo(() => selectInboxTasks(tasks).length, [tasks])

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 max-lg:w-[68px]">
      <ScrollArea className="flex-1">
        <nav aria-label="Main" className="flex flex-col gap-0.5 p-2">
          <NavItem
            href="/today"
            label="Today"
            icon={Sun}
            count={todayCount}
            active={pathname.startsWith("/today")}
          />
          <NavItem
            href="/inbox"
            label="Inbox"
            icon={Inbox}
            count={inboxCount}
            active={pathname.startsWith("/inbox")}
          />
          <NavItem
            href="/upcoming"
            label="Upcoming"
            icon={CalendarDays}
            active={pathname.startsWith("/upcoming")}
          />

          <div className="my-2 h-px bg-sidebar-border" />

          <div className="flex items-center justify-between px-2.5 pb-1 pt-1 max-lg:justify-center max-lg:px-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground max-lg:hidden">
              Projects
            </p>
            <button
              type="button"
              aria-label="New project"
              onClick={() => openProjectDialog()}
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {projects.map((project) => {
            const isActive = pathname.startsWith("/projects") && selectedProjectId === project.id

            return (
              <Link
                key={project.id}
                href="/projects"
                onClick={() => selectProject(project.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  "max-lg:justify-center max-lg:px-0",
                  isActive
                    ? "bg-sidebar-accent text-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
                )}
              >
                <ProjectIcon
                  name={project.icon}
                  className="size-4 shrink-0"
                  // Project colors are user data, so they are applied inline
                  // rather than through a theme token.
                  style={{ color: accentPreset(project.color).hex }}
                />
                <span className="truncate max-lg:hidden">{project.name}</span>
              </Link>
            )
          })}

          <div className="my-2 h-px bg-sidebar-border" />

          <NavItem
            href="/statistics"
            label="Statistics"
            icon={BarChart3}
            active={pathname.startsWith("/statistics")}
          />
          <NavItem
            href="/settings"
            label="Settings"
            icon={Settings}
            active={pathname.startsWith("/settings")}
          />
        </nav>
      </ScrollArea>
    </aside>
  )
}
