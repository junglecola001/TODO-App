import { app, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from "electron"

import { IPC } from "@/lib/ipc-channels"
import { selectTodayTasks } from "@/lib/tasks"
import { formatTimerClock, TIMER_PHASE_LABELS } from "@/lib/timer"
import type { TimerState } from "@/types/timer"
import { timerRemainingMs } from "@/types/timer"

import { renderTrayIcon } from "./assets/icon"
import { listTasks } from "./db/repositories/task-repository"
import { timerService } from "./timer/timer-service"
import { markQuitting, showMainWindow, toggleMainWindow } from "./window"

const TASKS_IN_MENU = 5
const TOOLTIP_REFRESH_MS = 5_000

let tray: Tray | null = null
let tooltipTimer: NodeJS.Timeout | null = null

/**
 * The notification-area icon (plan.md §16). Closing the window hides FocusFlow
 * here instead of quitting, so the timer keeps running.
 */
export function createTray(): void {
  if (tray) return

  tray = new Tray(nativeImage.createFromBuffer(renderTrayIcon()))
  tray.on("click", () => toggleMainWindow())

  timerService.onChange(() => refreshTray())
  // The remaining time is not part of a transition, so the tooltip is refreshed
  // on a slow interval while a phase is running.
  tooltipTimer = setInterval(() => {
    if (timerService.getState().status === "running") refreshTray()
  }, TOOLTIP_REFRESH_MS)

  refreshTray()
}

export function refreshTray(): void {
  if (!tray) return

  const state = timerService.getState()
  const remaining = timerRemainingMs(state, Date.now())
  const taskTitle = state.taskId ? findTaskTitle(state.taskId) : null

  tray.setToolTip(
    [
      "FocusFlow",
      state.status === "idle"
        ? `${TIMER_PHASE_LABELS[state.phase]} · ${formatTimerClock(state.durationMs)}`
        : `${TIMER_PHASE_LABELS[state.phase]} · ${formatTimerClock(remaining)}${
            taskTitle ? ` · ${taskTitle}` : ""
          }`,
    ].join("\n")
  )

  tray.setContextMenu(Menu.buildFromTemplate(buildMenu(state, remaining, taskTitle)))
}

export function destroyTray(): void {
  if (tooltipTimer) {
    clearInterval(tooltipTimer)
    tooltipTimer = null
  }
  tray?.destroy()
  tray = null
}

function buildMenu(
  state: TimerState,
  remaining: number,
  taskTitle: string | null
): MenuItemConstructorOptions[] {
  const transport: MenuItemConstructorOptions =
    state.status === "running"
      ? {
          label: `Pause · ${formatTimerClock(remaining)}`,
          click: () => void timerService.pause(),
        }
      : state.status === "paused"
        ? { label: "Resume", click: () => void timerService.resume() }
        : {
            label: `Start ${TIMER_PHASE_LABELS[state.phase].toLowerCase()}`,
            click: () => void timerService.start(),
          }

  const todayTasks = selectTodayTasks(listTasks()).slice(0, TASKS_IN_MENU)
  const taskItems: MenuItemConstructorOptions[] =
    todayTasks.length > 0
      ? todayTasks.map((task) => ({
          label: task.title,
          click: () => {
            showMainWindow().webContents.send(IPC.AppOpenTask, task.id)
          },
        }))
      : [{ label: "Nothing planned", enabled: false }]

  return [
    {
      label: taskTitle ? `${TIMER_PHASE_LABELS[state.phase]} · ${taskTitle}` : "FocusFlow",
      enabled: false,
    },
    { type: "separator" },
    transport,
    { type: "separator" },
    { label: "Today's Tasks", enabled: false },
    ...taskItems,
    { type: "separator" },
    { label: "Open FocusFlow", click: () => showMainWindow() },
    {
      label: "Quit",
      click: () => {
        markQuitting()
        app.quit()
      },
    },
  ]
}

function findTaskTitle(taskId: string): string | null {
  return listTasks().find((task) => task.id === taskId)?.title ?? null
}
