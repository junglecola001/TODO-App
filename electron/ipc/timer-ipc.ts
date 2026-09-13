import { ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { TimerPhase } from "@/types/timer"

import { timerService } from "../timer/timer-service"
import { databaseOperation } from "./errors"

/**
 * The renderer drives the timer, but never computes it: every command returns
 * the authoritative state so the UI and the main process can never disagree.
 */
export function registerTimerIpc(): void {
  ipcMain.handle(IPC.TimerGetState, () => timerService.getState())

  ipcMain.handle(
    IPC.TimerStart,
    (_event, options: { phase?: TimerPhase; taskId?: string | null } | undefined) =>
      databaseOperation("Unable to start the timer.", () => timerService.start(options ?? {}))
  )

  ipcMain.handle(IPC.TimerPause, () =>
    databaseOperation("Unable to pause the timer.", () => timerService.pause())
  )

  ipcMain.handle(IPC.TimerResume, () =>
    databaseOperation("Unable to resume the timer.", () => timerService.resume())
  )

  ipcMain.handle(IPC.TimerReset, () =>
    databaseOperation("Unable to reset the timer.", () => timerService.reset())
  )

  ipcMain.handle(IPC.TimerSkip, () =>
    databaseOperation("Unable to skip this phase.", () => timerService.skip())
  )

  ipcMain.handle(IPC.TimerSetPhase, (_event, phase: TimerPhase) =>
    databaseOperation("Unable to change the timer phase.", () => timerService.setPhase(phase))
  )

  ipcMain.handle(IPC.TimerSelectTask, (_event, taskId: string | null) =>
    databaseOperation("Unable to attach that task to the timer.", () =>
      timerService.selectTask(taskId)
    )
  )
}
