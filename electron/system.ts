import { app } from "electron"

/**
 * Keeps the Windows login item in step with the `startAtLogin` setting.
 *
 * In development the "app" is the Electron binary plus the project path, which
 * is exactly what launching a dev build means, so the toggle behaves the same
 * in both cases.
 */
export function applyAutoLaunch(openAtLogin: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin,
      path: process.execPath,
      args: app.isPackaged ? [] : [app.getAppPath()],
    })
  } catch (error) {
    console.error("[focusflow] could not update the Windows login item", error)
  }
}
