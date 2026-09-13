import { app, ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { SystemInfo } from "@/types/ipc"

import { getShortcutRegistrations } from "../shortcuts"

/**
 * Read-only system facts the renderer is allowed to show: whether FocusFlow is
 * registered to start with Windows, and whether each global shortcut could
 * actually be claimed (plan.md §17 asks for a clear warning on conflicts).
 */
export function registerSystemIpc(): void {
  ipcMain.handle(
    IPC.SystemGetInfo,
    (): SystemInfo => ({
      autoLaunchEnabled: app.getLoginItemSettings().openAtLogin,
      shortcuts: getShortcutRegistrations(),
    })
  )
}
