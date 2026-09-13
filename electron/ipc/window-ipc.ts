import { BrowserWindow, ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from "electron"

import { IPC } from "@/lib/ipc-channels"

function senderWindow(event: IpcMainEvent | IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerWindowIpc(): void {
  ipcMain.on(IPC.WindowMinimize, (event) => {
    senderWindow(event)?.minimize()
  })

  ipcMain.on(IPC.WindowToggleMaximize, (event) => {
    const window = senderWindow(event)
    if (!window) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })

  ipcMain.on(IPC.WindowClose, (event) => {
    senderWindow(event)?.close()
  })

  ipcMain.handle(IPC.WindowIsMaximized, (event) => senderWindow(event)?.isMaximized() ?? false)
}
