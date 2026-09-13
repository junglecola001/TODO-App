import { globalShortcut } from "electron"

import { timerService } from "./timer/timer-service"
import { toggleMainWindow } from "./window"

export interface ShortcutRegistration {
  accelerator: string
  label: string
  /** False when another application already owns this combination. */
  registered: boolean
}

interface GlobalShortcut {
  accelerator: string
  label: string
  run: () => void
}

/**
 * The system-wide shortcuts from plan.md §17. Only the Ctrl+Alt+… pairs are
 * registered globally: Ctrl+N / Ctrl+K / Ctrl+Shift+F stay local to the window
 * because hijacking them system-wide would break other applications.
 */
const SHORTCUTS: GlobalShortcut[] = [
  {
    accelerator: "Control+Alt+P",
    label: "Open FocusFlow",
    run: () => toggleMainWindow(),
  },
  {
    accelerator: "Control+Alt+Space",
    label: "Start or pause focus",
    run: () => toggleFocusTimer(),
  },
]

let registrations: ShortcutRegistration[] = []

export function registerGlobalShortcuts(): ShortcutRegistration[] {
  registrations = SHORTCUTS.map(({ accelerator, label, run }) => {
    let registered = false
    try {
      registered = globalShortcut.register(accelerator, run)
    } catch (error) {
      console.error(`[focusflow] invalid global shortcut ${accelerator}`, error)
    }

    if (!registered) {
      console.warn(
        `[focusflow] ${accelerator} is already taken by another application — "${label}" will not work system-wide`
      )
    }

    return { accelerator, label, registered }
  })

  return registrations
}

export function getShortcutRegistrations(): ShortcutRegistration[] {
  return registrations
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}

function toggleFocusTimer(): void {
  const state = timerService.getState()

  if (state.status === "running") {
    timerService.pause()
    return
  }

  if (state.status === "paused") {
    timerService.resume()
    return
  }

  timerService.start()
}
