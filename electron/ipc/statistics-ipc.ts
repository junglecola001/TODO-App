import { ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"

import { getStatistics } from "../db/repositories/statistics-repository"
import { databaseOperation } from "./errors"

export function registerStatisticsIpc(): void {
  ipcMain.handle(IPC.StatisticsGet, (_event, rangeDays: number) =>
    databaseOperation("Unable to load your statistics.", () => getStatistics(rangeDays))
  )
}
