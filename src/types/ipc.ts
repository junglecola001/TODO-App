import type {
  CreateProjectInput,
  CreateTaskInput,
  Project,
  Task,
  UpdateProjectInput,
  UpdateTaskInput,
} from "@/types/domain"
import type { AppSettings } from "@/types/settings"
import type { StatisticsSummary } from "@/types/statistics"
import type { TimerCompletionEvent, TimerPhase, TimerState } from "@/types/timer"

export interface AppInfo {
  name: string
  version: string
  platform: string
  isPackaged: boolean
  versions: {
    electron: string
    chrome: string
    node: string
  }
}

/** Window chrome controls for the frameless window. */
export interface WindowBridge {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  /** Subscribes to maximize/restore changes. Returns an unsubscribe function. */
  onMaximizedChange: (listener: (maximized: boolean) => void) => () => void
}

export interface AppBridge {
  getInfo: () => Promise<AppInfo>
}

export interface TasksBridge {
  list: () => Promise<Task[]>
  create: (input: CreateTaskInput) => Promise<Task>
  update: (id: string, patch: UpdateTaskInput) => Promise<Task>
  remove: (id: string) => Promise<void>
  setCompleted: (id: string, completed: boolean) => Promise<Task>
}

export interface ProjectsBridge {
  list: () => Promise<Project[]>
  create: (input: CreateProjectInput) => Promise<Project>
  update: (id: string, patch: UpdateProjectInput) => Promise<Project>
  remove: (id: string) => Promise<void>
}

export interface SettingsBridge {
  get: () => Promise<AppSettings>
  update: (patch: Partial<AppSettings>) => Promise<AppSettings>
}

export interface TimerBridge {
  getState: () => Promise<TimerState>
  start: (options?: { phase?: TimerPhase; taskId?: string | null }) => Promise<TimerState>
  pause: () => Promise<TimerState>
  resume: () => Promise<TimerState>
  reset: () => Promise<TimerState>
  skip: () => Promise<TimerState>
  setPhase: (phase: TimerPhase) => Promise<TimerState>
  selectTask: (taskId: string | null) => Promise<TimerState>
  /** Fires on every transition, including phase completion. Returns an unsubscribe function. */
  onStateChanged: (listener: (state: TimerState) => void) => () => void
  /** Fires once when a phase finishes, before the next one begins. */
  onCompleted: (listener: (event: TimerCompletionEvent) => void) => () => void
}

export interface SystemShortcut {
  accelerator: string
  label: string
  /** False when another application already owns this combination. */
  registered: boolean
}

export interface SystemInfo {
  autoLaunchEnabled: boolean
  shortcuts: SystemShortcut[]
}

export interface SystemBridge {
  getInfo: () => Promise<SystemInfo>
  /** Fired when a task is opened from the tray menu. Returns an unsubscribe function. */
  onOpenTask: (listener: (taskId: string) => void) => () => void
}

export interface StatisticsBridge {
  get: (rangeDays: number) => Promise<StatisticsSummary>
}

/**
 * The complete surface exposed to the renderer through `contextBridge`.
 * The renderer has no other access to Node.js or Electron APIs.
 */
export interface FocusFlowApi {
  app: AppBridge
  window: WindowBridge
  tasks: TasksBridge
  projects: ProjectsBridge
  settings: SettingsBridge
  timer: TimerBridge
  system: SystemBridge
  statistics: StatisticsBridge
}
