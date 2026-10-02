import { ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"

import { checkForUpdates, openReleasePage } from "../updates"

export function registerUpdatesIpc(): void {
  ipcMain.handle(IPC.UpdatesCheck, () => checkForUpdates())
  ipcMain.handle(IPC.UpdatesOpenRelease, () => openReleasePage())
}
