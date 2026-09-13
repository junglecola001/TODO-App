import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { CreateProjectInput, CreateTaskInput, UpdateProjectInput, UpdateTaskInput } from "@/types/domain"
import type { AppInfo, FocusFlowApi, SystemInfo } from "@/types/ipc"
import type { AppSettings } from "@/types/settings"
import type { StatisticsSummary } from "@/types/statistics"
import type { TimerCompletionEvent, TimerPhase, TimerState } from "@/types/timer"

/**
 * The only bridge between the renderer and the system. Nothing else is exposed:
 * no `ipcRenderer`, no `require`, no Node.js APIs.
 */
const api: FocusFlowApi = {
  app: {
    getInfo: () => ipcRenderer.invoke(IPC.AppGetInfo) as Promise<AppInfo>,
  },
  window: {
    minimize: () => ipcRenderer.send(IPC.WindowMinimize),
    toggleMaximize: () => ipcRenderer.send(IPC.WindowToggleMaximize),
    close: () => ipcRenderer.send(IPC.WindowClose),
    isMaximized: () => ipcRenderer.invoke(IPC.WindowIsMaximized) as Promise<boolean>,
    onMaximizedChange: (listener) => {
      const handler = (_event: IpcRendererEvent, maximized: boolean) => listener(maximized)
      ipcRenderer.on(IPC.WindowMaximizedChanged, handler)
      return () => {
        ipcRenderer.removeListener(IPC.WindowMaximizedChanged, handler)
      }
    },
  },
  tasks: {
    list: () => ipcRenderer.invoke(IPC.TasksList),
    create: (input: CreateTaskInput) => ipcRenderer.invoke(IPC.TasksCreate, input),
    update: (id: string, patch: UpdateTaskInput) => ipcRenderer.invoke(IPC.TasksUpdate, id, patch),
    remove: (id: string) => ipcRenderer.invoke(IPC.TasksDelete, id),
    setCompleted: (id: string, completed: boolean) =>
      ipcRenderer.invoke(IPC.TasksSetCompleted, id, completed),
  },
  projects: {
    list: () => ipcRenderer.invoke(IPC.ProjectsList),
    create: (input: CreateProjectInput) => ipcRenderer.invoke(IPC.ProjectsCreate, input),
    update: (id: string, patch: UpdateProjectInput) => ipcRenderer.invoke(IPC.ProjectsUpdate, id, patch),
    remove: (id: string) => ipcRenderer.invoke(IPC.ProjectsDelete, id),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SettingsGet) as Promise<AppSettings>,
    update: (patch: Partial<AppSettings>) =>
      ipcRenderer.invoke(IPC.SettingsUpdate, patch) as Promise<AppSettings>,
  },
  timer: {
    getState: () => ipcRenderer.invoke(IPC.TimerGetState) as Promise<TimerState>,
    start: (options?: { phase?: TimerPhase; taskId?: string | null }) =>
      ipcRenderer.invoke(IPC.TimerStart, options) as Promise<TimerState>,
    pause: () => ipcRenderer.invoke(IPC.TimerPause) as Promise<TimerState>,
    resume: () => ipcRenderer.invoke(IPC.TimerResume) as Promise<TimerState>,
    reset: () => ipcRenderer.invoke(IPC.TimerReset) as Promise<TimerState>,
    skip: () => ipcRenderer.invoke(IPC.TimerSkip) as Promise<TimerState>,
    setPhase: (phase: TimerPhase) =>
      ipcRenderer.invoke(IPC.TimerSetPhase, phase) as Promise<TimerState>,
    selectTask: (taskId: string | null) =>
      ipcRenderer.invoke(IPC.TimerSelectTask, taskId) as Promise<TimerState>,
    onStateChanged: (listener) => {
      const handler = (_event: IpcRendererEvent, state: TimerState) => listener(state)
      ipcRenderer.on(IPC.TimerStateChanged, handler)
      return () => {
        ipcRenderer.removeListener(IPC.TimerStateChanged, handler)
      }
    },
    onCompleted: (listener) => {
      const handler = (_event: IpcRendererEvent, completion: TimerCompletionEvent) =>
        listener(completion)
      ipcRenderer.on(IPC.TimerCompleted, handler)
      return () => {
        ipcRenderer.removeListener(IPC.TimerCompleted, handler)
      }
    },
  },
  system: {
    getInfo: () => ipcRenderer.invoke(IPC.SystemGetInfo) as Promise<SystemInfo>,
    onOpenTask: (listener) => {
      const handler = (_event: IpcRendererEvent, taskId: string) => listener(taskId)
      ipcRenderer.on(IPC.AppOpenTask, handler)
      return () => {
        ipcRenderer.removeListener(IPC.AppOpenTask, handler)
      }
    },
  },
  statistics: {
    get: (rangeDays: number) =>
      ipcRenderer.invoke(IPC.StatisticsGet, rangeDays) as Promise<StatisticsSummary>,
  },
}

contextBridge.exposeInMainWorld("focusflow", api)
