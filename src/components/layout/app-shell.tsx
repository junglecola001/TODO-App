"use client"

import { useEffect, type ReactNode } from "react"
import { useTheme } from "next-themes"
import { TriangleAlert, X } from "lucide-react"
import { toast } from "sonner"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { CommandPalette } from "@/components/command-palette/command-palette"
import { ProjectDialog } from "@/components/project/project-dialog"
import { QuickAddDialog } from "@/components/task/quick-add-dialog"
import { TaskDialog } from "@/components/task/task-dialog"
import { FocusMode } from "@/components/timer/focus-mode"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAppShortcuts } from "@/hooks/use-app-shortcuts"
import { accentPreset } from "@/lib/constants"
import { getDesktopBridge } from "@/lib/ipc"
import { playSound } from "@/lib/sounds"
import { useProjectStore } from "@/stores/project-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTaskStore } from "@/stores/task-store"
import { useTimerStore } from "@/stores/timer-store"
import { useUiStore } from "@/stores/ui-store"

/**
 * The application frame: title bar, sidebar and content area.
 *
 * It also owns the two things that must be true app-wide: the stores are
 * loaded once here, and appearance settings are applied to the document.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const loadTasks = useTaskStore((state) => state.load)
  const loadProjects = useProjectStore((state) => state.load)
  const loadSettings = useSettingsStore((state) => state.load)

  const settingsStatus = useSettingsStore((state) => state.status)
  const themeSetting = useSettingsStore((state) => state.settings.theme)
  const accentSetting = useSettingsStore((state) => state.settings.accent)

  const taskError = useTaskStore((state) => state.error)
  const projectError = useProjectStore((state) => state.error)
  const settingsError = useSettingsStore((state) => state.error)
  const timerError = useTimerStore((state) => state.error)
  const clearTaskError = useTaskStore((state) => state.clearError)
  const clearProjectError = useProjectStore((state) => state.clearError)
  const clearSettingsError = useSettingsStore((state) => state.clearError)
  const clearTimerError = useTimerStore((state) => state.clearError)

  const notice = taskError ?? projectError ?? settingsError ?? timerError

  const { theme, setTheme } = useTheme()

  useAppShortcuts()

  useEffect(() => {
    void loadSettings()
    void loadTasks()
    void loadProjects()
  }, [loadSettings, loadTasks, loadProjects])

  // The timer lives in the main process; this only mirrors it and announces
  // finished phases while FocusFlow is on screen.
  useEffect(() => {
    return useTimerStore.getState().init({
      onCompleted: (event) => {
        if (event.phase === "focus") {
          playSound("focusComplete")

          // A finished focus session bumps the task's pomodoro count in the
          // database, so the list has to be re-read to show it.
          void useTaskStore.getState().load()

          toast.success("Focus complete", {
            description: event.taskTitle
              ? `Great work on “${event.taskTitle}”. Time for a break.`
              : "Great work. Time for a break.",
          })
          return
        }

        playSound("breakComplete")
        toast.success("Break finished", { description: "Ready for another focus?" })
      },
    })
  }, [])

  // The database is the source of truth for appearance. next-themes keeps a
  // copy in localStorage so the very first paint is already correct; this sync
  // covers the case where the stored preference changed.
  useEffect(() => {
    if (settingsStatus === "ready" && themeSetting !== theme) {
      setTheme(themeSetting)
    }
  }, [settingsStatus, themeSetting, theme, setTheme])

  // Opening a task from the tray menu lands here.
  useEffect(() => {
    const bridge = getDesktopBridge()
    if (!bridge) return

    return bridge.system.onOpenTask((taskId) => {
      useUiStore.getState().openTaskDialog({ taskId })
    })
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", accentPreset(accentSetting).hsl)
  }, [accentSetting])

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={200}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header />

        {notice ? (
          <div
            role="alert"
            className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive"
          >
            <TriangleAlert className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{notice}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="rounded-sm p-0.5 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={() => {
                clearTaskError()
                clearProjectError()
                clearSettingsError()
                clearTimerError()
              }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>

        {/* Global dialogs: reachable from shortcuts, the sidebar and pages. */}
        <TaskDialog />
        <QuickAddDialog />
        <ProjectDialog />
        <CommandPalette />

        {/* Covers the shell while it is active; leaving restores the view. */}
        <FocusMode />
      </div>
    </TooltipProvider>
  )
}
