import { registerAppIpc } from "./app-ipc"
import { registerWindowIpc } from "./window-ipc"

/** Wires every IPC handler. Called once, after the app is ready. */
export function registerIpcHandlers(): void {
  registerWindowIpc()
  registerAppIpc()
}
