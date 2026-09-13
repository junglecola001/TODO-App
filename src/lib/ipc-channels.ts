/**
 * IPC channel names shared by the Electron main process and the renderer.
 * Keeping them in one module prevents silent typos between the two sides.
 */
export const IPC = {
  // Window chrome
  WindowMinimize: "window:minimize",
  WindowToggleMaximize: "window:toggle-maximize",
  WindowClose: "window:close",
  WindowIsMaximized: "window:is-maximized",
  WindowMaximizedChanged: "window:maximized-changed",

  // App metadata
  AppGetInfo: "app:get-info",
  /** Pushed from the tray: "open this task". */
  AppOpenTask: "app:open-task",

  // System integration
  SystemGetInfo: "system:get-info",

  // Statistics
  StatisticsGet: "statistics:get",

  // Tasks
  TasksList: "tasks:list",
  TasksCreate: "tasks:create",
  TasksUpdate: "tasks:update",
  TasksDelete: "tasks:delete",
  TasksSetCompleted: "tasks:set-completed",

  // Projects
  ProjectsList: "projects:list",
  ProjectsCreate: "projects:create",
  ProjectsUpdate: "projects:update",
  ProjectsDelete: "projects:delete",

  // Settings
  SettingsGet: "settings:get",
  SettingsUpdate: "settings:update",

  // Pomodoro timer (owned by the main process)
  TimerGetState: "timer:get-state",
  TimerStart: "timer:start",
  TimerPause: "timer:pause",
  TimerResume: "timer:resume",
  TimerReset: "timer:reset",
  TimerSkip: "timer:skip",
  TimerSetPhase: "timer:set-phase",
  TimerSelectTask: "timer:select-task",
  TimerStateChanged: "timer:state-changed",
  TimerCompleted: "timer:completed",
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
