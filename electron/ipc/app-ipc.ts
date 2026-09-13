import { app, ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { AppInfo } from "@/types/ipc"

export function registerAppIpc(): void {
  ipcMain.handle(IPC.AppGetInfo, (): AppInfo => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      isPackaged: app.isPackaged,
      versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
      },
    }
  })
}
