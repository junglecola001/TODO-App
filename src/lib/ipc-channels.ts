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
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
