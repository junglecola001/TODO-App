import path from "node:path"

import { app } from "electron"

/**
 * True when the renderer is served from the exported `out/` directory
 * (packaged builds, or `npm run preview`), false when it comes from `next dev`.
 */
export const serveExport = app.isPackaged || process.env.FOCUSFLOW_USE_EXPORT === "1"

/** Running from source with the Next.js dev server available. */
export const isDev = !app.isPackaged

export const DEV_SERVER_URL = process.env.FOCUSFLOW_DEV_SERVER_URL ?? "http://localhost:3000"

/** The statically exported renderer produced by `next build`. */
export function rendererRoot(): string {
  return path.join(app.getAppPath(), "out")
}

/**
 * All mutable user data lives in %APPDATA%/FocusFlow — never in the install
 * directory, which may be read-only.
 */
export function userDataDir(): string {
  return app.getPath("userData")
}

export function databasePath(): string {
  return path.join(userDataDir(), "focusflow.db")
}
