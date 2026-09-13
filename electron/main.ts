import { app, BrowserWindow } from "electron"

import { registerIpcHandlers } from "./ipc"
import { registerAppProtocol, registerAppScheme } from "./protocol"
import { createMainWindow, getMainWindow } from "./window"

// Windows needs an explicit AppUserModelID for taskbar grouping and for
// notifications to be attributed to FocusFlow.
app.setAppUserModelId("com.focusflow.app")

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
    registerAppProtocol()
    registerIpcHandlers()
    createMainWindow()

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })
}
