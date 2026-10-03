import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Regression cover for the timer engine's cached phase length.
 *
 * The engine stores `durationMs` in its state and only re-reads the settings on
 * a transition, so editing a duration in Settings used to leave the main
 * readout showing the old length (25:00) until the phase next changed. These
 * tests pin the contract that `syncSettings()` closes: an idle phase follows
 * the stored settings at once, a phase already under way keeps its own length.
 *
 * The datastore and repositories are real — only Electron itself is faked.
 */
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "focusflow-timer-"))
process.env.FOCUSFLOW_TEST_USER_DATA = userDataDir

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.env.FOCUSFLOW_TEST_USER_DATA,
    getAppPath: () => process.cwd(),
  },
  // The service broadcasts to every open window; these tests read the service's
  // own state instead of Electron's messaging.
  BrowserWindow: { getAllWindows: () => [] },
  Notification: class {
    static isSupported() {
      return false
    }
    show() {
      /* never reached: isSupported() is false */
    }
  },
}))

import { closeDatabase, initDatabase } from "../electron/db/index"
import { writeSettings } from "../electron/db/repositories/settings-repository"
import { timerService } from "../electron/timer/timer-service"

const MINUTE = 60_000

beforeAll(() => {
  initDatabase()
})

afterAll(() => {
  closeDatabase()
  fs.rmSync(userDataDir, { recursive: true, force: true })
})

beforeEach(() => {
  // A known idle focus phase, so every test starts from the same 25 minutes.
  // `setPhase` also stops any ticker a previous test left running.
  writeSettings({ focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 })
  timerService.setPhase("focus")
})

describe("timer durations follow Settings", () => {
  it("builds an idle phase from the stored focus time", () => {
    writeSettings({ focusMinutes: 50 })
    timerService.setPhase("focus")

    expect(timerService.getState()).toMatchObject({ status: "idle", durationMs: 50 * MINUTE })
  })

  it("re-derives an idle phase when the focus time changes", () => {
    expect(timerService.getState().durationMs).toBe(25 * MINUTE)

    // What the SettingsUpdate IPC handler does after writing a patch.
    writeSettings({ focusMinutes: 50 })
    timerService.syncSettings()

    expect(timerService.getState().durationMs).toBe(50 * MINUTE)
  })

  it("follows the duration of every phase, not just focus", () => {
    writeSettings({ shortBreakMinutes: 7, longBreakMinutes: 20 })

    for (const [phase, minutes] of [
      ["focus", 25],
      ["short_break", 7],
      ["long_break", 20],
    ] as const) {
      timerService.setPhase(phase)
      timerService.syncSettings()

      expect(timerService.getState().durationMs).toBe(minutes * MINUTE)
    }
  })

  it("leaves a running phase alone, so the visible countdown stays honest", () => {
    timerService.start()
    expect(timerService.getState()).toMatchObject({ status: "running", durationMs: 25 * MINUTE })

    writeSettings({ focusMinutes: 50 })
    timerService.syncSettings()

    expect(timerService.getState()).toMatchObject({ status: "running", durationMs: 25 * MINUTE })
  })

  it("leaves a paused phase alone too", () => {
    timerService.start()
    timerService.pause()

    writeSettings({ focusMinutes: 50 })
    timerService.syncSettings()

    expect(timerService.getState()).toMatchObject({ status: "paused", durationMs: 25 * MINUTE })
  })

  it("applies a deferred change from the next phase onwards", () => {
    timerService.start() // focus, 25 minutes, running
    writeSettings({ focusMinutes: 50 })
    timerService.syncSettings() // the running phase keeps its length

    timerService.setPhase("focus") // a fresh focus phase

    expect(timerService.getState()).toMatchObject({ status: "idle", durationMs: 50 * MINUTE })
  })
})
