import { ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { AppSettings } from "@/types/settings"

import { readSettings, writeSettings } from "../db/repositories/settings-repository"
import { applyAutoLaunch } from "../system"
import { timerService } from "../timer/timer-service"
import { databaseOperation } from "./errors"

export function registerSettingsIpc(): void {
  ipcMain.handle(IPC.SettingsGet, () =>
    databaseOperation("Unable to load your settings.", () => readSettings())
  )

  ipcMain.handle(IPC.SettingsUpdate, (_event, patch: Partial<AppSettings>) =>
    databaseOperation("Unable to save your settings.", () => {
      const settings = writeSettings(patch)

      // Options that reach outside the app are applied as soon as they change.
      if (patch && "startAtLogin" in patch) {
        applyAutoLaunch(settings.startAtLogin)
      }

      // The timer caches the length of its current phase, so an idle readout
      // has to be re-derived here — otherwise a new focus time only takes
      // effect after the phase next changes.
      timerService.syncSettings()

      return settings
    })
  )
}
