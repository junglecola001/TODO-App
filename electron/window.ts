import path from "node:path"

import { BrowserWindow, nativeImage, nativeTheme, shell } from "electron"

import { IPC } from "@/lib/ipc-channels"

import { renderAppIcon } from "./assets/icon"
import { readSettings } from "./db/repositories/settings-repository"
import { DEV_SERVER_URL, isDev, serveExport } from "./lib/paths"
import { notifyHiddenToTrayOnce } from "./notifications"
import { APP_ORIGIN } from "./protocol"

let mainWindow: BrowserWindow | null = null
/** Set while a real quit is in progress, so closing stops hiding to the tray. */
let quitting = false

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function markQuitting(): void {
  quitting = true
}

/** Brings the window back from the tray, recreating it if it was destroyed. */
export function showMainWindow(): BrowserWindow {
  const window = mainWindow ?? createMainWindow()

  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
  return window
}

/** Tray click: the window behaves like a toggle. */
export function toggleMainWindow(): void {
  const window = mainWindow

  if (window && window.isVisible() && window.isFocused()) {
    window.hide()
    return
  }

  showMainWindow()
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    show: false,
    // The app draws its own title bar so the chrome matches the design.
    frame: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#111111" : "#F7F7F5",
    icon: nativeImage.createFromBuffer(renderAppIcon(256)),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
      devTools: isDev,
    },
  })

  mainWindow = window

  window.once("ready-to-show", () => window.show())
  window.on("closed", () => {
    mainWindow = null
  })

  // Closing the window hides FocusFlow to the tray instead of quitting
  // (plan.md §16): the timer has to keep running. "Quit" from the tray menu
  // sets the quitting flag first.
  window.on("close", (event) => {
    if (quitting) return
    if (!readSettings().closeToTray) return

    event.preventDefault()
    window.hide()
    notifyHiddenToTrayOnce()
  })

  const notifyMaximizedChanged = () => {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC.WindowMaximizedChanged, window.isMaximized())
    }
  }
  window.on("maximize", notifyMaximizedChanged)
  window.on("unmaximize", notifyMaximizedChanged)

  // Never let the renderer open windows or navigate away from the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void openExternally(url)
    return { action: "deny" }
  })

  window.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return
    event.preventDefault()
    void openExternally(url)
  })

  void loadRenderer(window)

  return window
}

function isAppUrl(url: string): boolean {
  return serveExport ? url.startsWith(APP_ORIGIN) : url.startsWith(DEV_SERVER_URL)
}

async function openExternally(url: string): Promise<void> {
  if (/^https?:\/\//i.test(url)) {
    await shell.openExternal(url)
  }
}

/**
 * The dev server is usually a second or two behind Electron, so keep retrying
 * instead of showing a blank window. FocusFlow always opens on Today.
 */
async function loadRenderer(window: BrowserWindow): Promise<void> {
  const url = serveExport ? `${APP_ORIGIN}/today/` : `${DEV_SERVER_URL}/today`
  const attempts = isDev ? 120 : 1

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await window.loadURL(url)
      return
    } catch (error) {
      if (attempt === attempts) {
        console.error(`[focusflow] could not load ${url}`, error)
        return
      }
      await delay(500)
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
