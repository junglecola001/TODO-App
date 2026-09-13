import { registerAppIpc } from "./app-ipc"
import { registerProjectIpc } from "./projects-ipc"
import { registerSettingsIpc } from "./settings-ipc"
import { registerStatisticsIpc } from "./statistics-ipc"
import { registerSystemIpc } from "./system-ipc"
import { registerTaskIpc } from "./tasks-ipc"
import { registerTimerIpc } from "./timer-ipc"
import { registerWindowIpc } from "./window-ipc"

/** Wires every IPC handler. Called once, after the app is ready. */
export function registerIpcHandlers(): void {
  registerWindowIpc()
  registerAppIpc()
  registerTaskIpc()
  registerProjectIpc()
  registerSettingsIpc()
  registerTimerIpc()
  registerSystemIpc()
  registerStatisticsIpc()
}
