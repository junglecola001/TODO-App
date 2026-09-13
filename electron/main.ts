import { app, BrowserWindow } from "electron"

import { closeDatabase, initDatabase } from "./db"
import { ensureStarterProjects } from "./db/repositories/project-repository"
import { readSettings } from "./db/repositories/settings-repository"
import { registerIpcHandlers } from "./ipc"
import { registerAppProtocol, registerAppScheme } from "./protocol"
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from "./shortcuts"
import { applyAutoLaunch } from "./system"
import { timerService } from "./timer/timer-service"
import { createTray, destroyTray } from "./tray"
import { createMainWindow, getMainWindow, markQuitting } from "./window"

// Windows needs an explicit AppUserModelID for taskbar grouping and for
// notifications to be attributed to FocusFlow.
app.setAppUserModelId("com.focusflow.app")

// Pins the data directory to %APPDATA%/FocusFlow instead of the package name.
app.setName("FocusFlow")

// Privileged schemes must be declared before the app is ready.
registerAppScheme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on("second-instance", () => {
    const window = getMainWindow()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
  })

  app.whenReady().then(() => {
    initDatabase()
    ensureStarterProjects()
    timerService.restore()
    registerAppProtocol()
    registerIpcHandlers()

    // Windows integration: tray, global shortcuts and the login item.
    applyAutoLaunch(readSettings().startAtLogin)
    registerGlobalShortcuts()
    createTray()

    createMainWindow()

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on("before-quit", () => {
    markQuitting()
  })

  app.on("will-quit", () => {
    unregisterGlobalShortcuts()
    destroyTray()
    closeDatabase()
  })

  app.on("window-all-closed", () => {
    // With "close to tray" on, the window is only hidden, so this never fires.
    if (process.platform !== "darwin") app.quit()
  })
}
