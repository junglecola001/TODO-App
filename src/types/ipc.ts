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

/**
 * The complete surface exposed to the renderer through `contextBridge`.
 * The renderer has no other access to Node.js or Electron APIs.
 */
export interface FocusFlowApi {
  app: AppBridge
  window: WindowBridge
}
