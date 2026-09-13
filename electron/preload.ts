import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { AppInfo, FocusFlowApi } from "@/types/ipc"

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
}

contextBridge.exposeInMainWorld("focusflow", api)
