import { Notification } from "electron"

import { readRawSetting, readSettings, writeRawSetting } from "./db/repositories/settings-repository"
import type { TimerPhase } from "@/types/timer"

const TRAY_HINT_FLAG = "tray_hint_shown"

/**
 * Windows notifications for finished phases. The sound is ours (see the
 * renderer's soft chimes) so the native one stays silent, and both the focus
 * and break messages can be switched off in Settings.
 */
export function notifyPhaseComplete(phase: TimerPhase, taskTitle: string | null): void {
  const settings = readSettings()

  if (phase === "focus" && !settings.notifyOnFocusComplete) return
  if (phase !== "focus" && !settings.notifyOnBreakComplete) return

  if (phase === "focus") {
    show(
      "Focus complete",
      taskTitle ? `Great work on “${taskTitle}”. Time for a break.` : "Great work. Time for a break."
    )
    return
  }

  show("Break finished", "Ready for another focus?")
}

/**
 * The first time the window is hidden to the tray, say so — otherwise closing
 * the window looks like the app vanished.
 */
export function notifyHiddenToTrayOnce(): void {
  try {
    if (readRawSetting(TRAY_HINT_FLAG)) return
    writeRawSetting(TRAY_HINT_FLAG, JSON.stringify(true))
  } catch (error) {
    console.error("[focusflow] could not record the tray hint", error)
    return
  }

  show("Still running", "FocusFlow keeps your timer going in the notification area.")
}

function show(title: string, body: string): void {
  if (!Notification.isSupported()) return
  new Notification({ title, body, silent: true }).show()
}
