import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Integration tests for the data layer: a real SQLite file in a temp directory,
 * the real migrations and the real repositories. The only thing faked is
 * Electron itself, because the paths module reads `app.isPackaged` at load time
 * and `app.getPath("userData")` decides where the database lives.
 */
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "focusflow-test-"))
process.env.FOCUSFLOW_TEST_USER_DATA = userDataDir

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.env.FOCUSFLOW_TEST_USER_DATA,
    getAppPath: () => process.cwd(),
  },
}))

import { closeDatabase, getSqlite, initDatabase } from "../electron/db/index"
import {
  createProject,
  deleteProject,
  ensureStarterProjects,
  listProjects,
} from "../electron/db/repositories/project-repository"
import { createSession, listSessionsForTask } from "../electron/db/repositories/session-repository"
import {
  readRawSetting,
  readSettings,
  writeRawSetting,
  writeSettings,
} from "../electron/db/repositories/settings-repository"
import { getStatistics } from "../electron/db/repositories/statistics-repository"
import {
  createTask,
  deleteTask,
  getTask,
  incrementTaskPomodoros,
  listTasks,
  setTaskCompleted,
  updateTask,
} from "../electron/db/repositories/task-repository"

/** Wednesday, 4 March 2026, 10:00 local time. */
const TODAY = new Date(2026, 2, 4, 10, 0, 0)

const at = (dayOffset: number, hour: number) =>
  new Date(2026, 2, 4 + dayOffset, hour, 0, 0).getTime()

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
  initDatabase()
  ensureStarterProjects()
})

afterAll(() => {
  closeDatabase()
  vi.useRealTimers()
  fs.rmSync(userDataDir, { recursive: true, force: true })
})

beforeEach(() => {
  const sqlite = getSqlite()
  sqlite.exec("DELETE FROM pomodoro_sessions; DELETE FROM tasks;")
})

describe("database schema", () => {
  it("applies the migrations and records the version", () => {
    const version = getSqlite().pragma("user_version", { simple: true })

    expect(version).toBe(1)
  })

  it("creates every table the app relies on", () => {
    const rows = getSqlite()
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>
    const tables = rows.map((row) => row.name)

    expect(tables).toEqual(
      expect.arrayContaining(["projects", "tasks", "pomodoro_sessions", "settings"])
    )
  })
})

describe("task repository", () => {
  it("creates a task with defaults and a trimmed title", () => {
    const task = createTask({ title: "  Finish homework  " })

    expect(task.id).toMatch(/[0-9a-f-]{36}/)
    expect(task.title).toBe("Finish homework")
    expect(task.description).toBeNull()
    expect(task.completed).toBe(false)
    expect(task.priority).toBe("none")
    expect(task.dueDate).toBeNull()
    expect(task.estimatedPomodoros).toBe(0)
    expect(task.actualPomodoros).toBe(0)
    expect(task.completedAt).toBeNull()
    expect(getTask(task.id)).toEqual(task)
  })

  it("refuses a task without a title", () => {
    expect(() => createTask({ title: "   " })).toThrow(/title/i)
  })

  it("rounds and clamps the pomodoro estimate", () => {
    expect(createTask({ title: "a", estimatedPomodoros: 2.6 }).estimatedPomodoros).toBe(3)
    expect(createTask({ title: "b", estimatedPomodoros: -4 }).estimatedPomodoros).toBe(0)
  })

  it("lists newest first", () => {
    const first = createTask({ title: "first" })
    vi.advanceTimersByTime(10)
    const second = createTask({ title: "second" })

    expect(listTasks().map((task) => task.id)).toEqual([second.id, first.id])
  })

  it("updates the fields a patch mentions and leaves the rest alone", () => {
    const task = createTask({ title: "Draft", priority: "low" })
    vi.advanceTimersByTime(10)

    const updated = updateTask(task.id, {
      title: "  Rewrite  ",
      priority: "high",
      dueDate: "2026-03-06",
      estimatedPomodoros: 4,
    })

    expect(updated).not.toBeNull()
    expect(updated!.title).toBe("Rewrite")
    expect(updated!.priority).toBe("high")
    expect(updated!.dueDate).toBe("2026-03-06")
    expect(updated!.estimatedPomodoros).toBe(4)
    expect(updated!.description).toBeNull()
    expect(updated!.createdAt).toBe(task.createdAt)
  })

  it("rejects an empty title in a patch", () => {
    const task = createTask({ title: "Draft" })

    expect(() => updateTask(task.id, { title: "  " })).toThrow(/title/i)
    expect(getTask(task.id)!.title).toBe("Draft")
  })

  it("returns null for an unknown id", () => {
    expect(updateTask("missing", { title: "x" })).toBeNull()
    expect(getTask("missing")).toBeNull()
    expect(setTaskCompleted("missing", true)).toBeNull()
  })

  it("stamps and clears completedAt through setTaskCompleted", () => {
    const task = createTask({ title: "Draft" })
    vi.advanceTimersByTime(5_000)

    const done = setTaskCompleted(task.id, true)
    expect(done!.completed).toBe(true)
    expect(done!.completedAt).toBe(Date.now())

    const reopened = setTaskCompleted(task.id, false)
    expect(reopened!.completed).toBe(false)
    expect(reopened!.completedAt).toBeNull()
  })

  it("counts finished pomodoros", () => {
    const task = createTask({ title: "Draft" })

    incrementTaskPomodoros(task.id)
    incrementTaskPomodoros(task.id)

    expect(getTask(task.id)!.actualPomodoros).toBe(2)
  })

  it("deletes a task", () => {
    const task = createTask({ title: "Draft" })

    deleteTask(task.id)

    expect(getTask(task.id)).toBeNull()
    expect(listTasks()).toHaveLength(0)
  })
})

describe("sessions and foreign keys", () => {
  it("keeps a session alive when its task is deleted, with task_id cleared", () => {
    const task = createTask({ title: "Draft" })
    const session = createSession({
      taskId: task.id,
      type: "focus",
      startedAt: at(0, 9),
      completedAt: at(0, 9) + 1_500_000,
      duration: 1_500_000,
    })

    deleteTask(task.id)

    // The row survives the delete (a session is history, not a child record)…
    const row = getSqlite()
      .prepare("SELECT id, task_id FROM pomodoro_sessions ORDER BY started_at")
      .all() as Array<{ id: string; task_id: string | null }>
    expect(row).toHaveLength(1)
    expect(row[0]!.id).toBe(session.id)

    // …but it is no longer attached to the deleted task, so it stops showing
    // up in that task's history.
    expect(row[0]!.task_id).toBeNull()
    expect(listSessionsForTask(task.id)).toHaveLength(0)
  })
})

describe("statistics repository", () => {
  it("is empty on a fresh database", () => {
    const summary = getStatistics(7)

    expect(summary.rangeDays).toBe(7)
    expect(summary.focusSessions).toBe(0)
    expect(summary.focusMs).toBe(0)
    expect(summary.completedTasks).toBe(0)
    expect(summary.averageFocusMs).toBe(0)
    expect(summary.streakDays).toBe(0)
    expect(summary.daily).toHaveLength(7)
    expect(summary.daily[6]!.date).toBe("2026-03-04")
  })

  it("counts focus sessions only, and sums their duration", () => {
    createSession({ taskId: null, type: "focus", startedAt: at(0, 9), completedAt: at(0, 9) + 1, duration: 1_500_000 })
    createSession({ taskId: null, type: "focus", startedAt: at(0, 9), completedAt: at(0, 9) + 1, duration: 900_000 })
    createSession({ taskId: null, type: "short_break", startedAt: at(0, 9), completedAt: at(0, 9) + 1, duration: 300_000 })
    createSession({ taskId: null, type: "long_break", startedAt: at(0, 9), completedAt: at(0, 9) + 1, duration: 900_000 })

    const summary = getStatistics(7)

    expect(summary.focusSessions).toBe(2)
    expect(summary.focusMs).toBe(2_400_000)
    expect(summary.averageFocusMs).toBe(1_200_000)
    expect(summary.daily[6]!.focusSessions).toBe(2)
    expect(summary.daily[6]!.focusMs).toBe(2_400_000)
  })

  it("files a session under the local day it started, not UTC", () => {
    // 23:30 local on 3 March is the same day locally, whatever UTC says.
    createSession({
      taskId: null,
      type: "focus",
      startedAt: at(-1, 23),
      completedAt: at(-1, 23) + 1,
      duration: 600_000,
    })

    const summary = getStatistics(7)

    expect(summary.daily[5]!.date).toBe("2026-03-03")
    expect(summary.daily[5]!.focusSessions).toBe(1)
    expect(summary.daily[6]!.focusSessions).toBe(0)
  })

  it("ignores sessions older than the range", () => {
    createSession({
      taskId: null,
      type: "focus",
      startedAt: at(-30, 9),
      completedAt: at(-30, 9) + 1,
      duration: 600_000,
    })

    expect(getStatistics(7).focusSessions).toBe(0)
  })

  it("clamps an out-of-range window instead of failing", () => {
    expect(getStatistics(0).rangeDays).toBe(1)
    expect(getStatistics(-5).rangeDays).toBe(1)
    expect(getStatistics(9_999).rangeDays).toBe(366)
    expect(getStatistics(Number.NaN).rangeDays).toBe(7)
  })

  it("counts tasks completed today towards today", () => {
    const task = createTask({ title: "Draft" })
    setTaskCompleted(task.id, true)

    const summary = getStatistics(7)

    expect(summary.completedTasks).toBe(1)
    expect(summary.daily[6]!.completedTasks).toBe(1)

    setTaskCompleted(task.id, false)
    expect(getStatistics(7).completedTasks).toBe(0)
  })

  it("reports the current streak", () => {
    for (const dayOffset of [0, -1, -2]) {
      createSession({
        taskId: null,
        type: "focus",
        startedAt: at(dayOffset, 9),
        completedAt: at(dayOffset, 9) + 1,
        duration: 600_000,
      })
    }
    // A gap on day -3 must not be bridged.
    createSession({
      taskId: null,
      type: "focus",
      startedAt: at(-4, 9),
      completedAt: at(-4, 9) + 1,
      duration: 600_000,
    })

    expect(getStatistics(7).streakDays).toBe(3)
  })

  it("keeps a streak alive when nothing is finished yet today", () => {
    createSession({
      taskId: null,
      type: "focus",
      startedAt: at(-1, 9),
      completedAt: at(-1, 9) + 1,
      duration: 600_000,
    })

    expect(getStatistics(7).streakDays).toBe(1)
  })

  it("counts the tasks created inside the window", () => {
    createTask({ title: "today" })
    // A task created before the window must not be counted.
    const old = createTask({ title: "old" })
    getSqlite()
      .prepare("UPDATE tasks SET created_at = ? WHERE id = ?")
      .run(at(-30, 9), old.id)

    expect(getStatistics(7).createdTasks).toBe(1)
  })

  it("reports the longest run of focus days in the window", () => {
    for (const dayOffset of [0, -1, -3]) {
      createSession({
        taskId: null,
        type: "focus",
        startedAt: at(dayOffset, 9),
        completedAt: at(dayOffset, 9) + 1,
        duration: 600_000,
      })
    }

    const summary = getStatistics(7)

    // Today and yesterday form a two-day run; day -3 is a separate one.
    expect(summary.longestStreakDays).toBe(2)
    expect(summary.streakDays).toBe(2)
  })

  it("picks the busiest day of the window", () => {
    for (const hour of [9, 11]) {
      createSession({
        taskId: null,
        type: "focus",
        startedAt: at(-1, hour),
        completedAt: at(-1, hour) + 1,
        duration: 1_500_000,
      })
    }
    createSession({
      taskId: null,
      type: "focus",
      startedAt: at(0, 9),
      completedAt: at(0, 9) + 1,
      duration: 600_000,
    })

    const best = getStatistics(7).bestDay

    expect(best?.date).toBe("2026-03-03")
    expect(best?.focusSessions).toBe(2)
    expect(best?.focusMs).toBe(3_000_000)
  })

  it("has no best day before anything is finished", () => {
    expect(getStatistics(7).bestDay).toBeNull()
  })

  it("splits focus time by project, busiest first", () => {
    const project = createProject({ name: "Thesis", color: "purple" })
    const task = createTask({ title: "Chapter 1", projectId: project.id })

    createSession({
      taskId: task.id,
      type: "focus",
      startedAt: at(0, 9),
      completedAt: at(0, 9) + 1,
      duration: 900_000,
    })
    // A session with no task at all lands in the unassigned bucket.
    createSession({
      taskId: null,
      type: "focus",
      startedAt: at(0, 10),
      completedAt: at(0, 10) + 1,
      duration: 1_500_000,
    })
    // Breaks never count towards focus time.
    createSession({
      taskId: task.id,
      type: "short_break",
      startedAt: at(0, 11),
      completedAt: at(0, 11) + 1,
      duration: 8_000_000,
    })

    const byProject = getStatistics(7).byProject

    expect(byProject).toHaveLength(2)
    expect(byProject[0]).toMatchObject({
      projectId: null,
      name: "No project",
      color: null,
      focusSessions: 1,
      focusMs: 1_500_000,
    })
    expect(byProject[1]).toMatchObject({
      projectId: project.id,
      name: "Thesis",
      color: "purple",
      focusSessions: 1,
      focusMs: 900_000,
    })
  })

  it("moves focus time into the unassigned bucket when its project is deleted", () => {
    const project = createProject({ name: "Thesis" })
    const task = createTask({ title: "Chapter 1", projectId: project.id })
    createSession({
      taskId: task.id,
      type: "focus",
      startedAt: at(0, 9),
      completedAt: at(0, 9) + 1,
      duration: 600_000,
    })

    deleteProject(project.id)

    const byProject = getStatistics(7).byProject

    expect(byProject).toHaveLength(1)
    expect(byProject[0]).toMatchObject({ projectId: null, name: "No project", focusMs: 600_000 })
  })
})

describe("settings repository", () => {
  it("returns the documented defaults on an empty database", () => {
    const settings = readSettings()

    expect(settings.focusMinutes).toBe(25)
    expect(settings.shortBreakMinutes).toBe(5)
    expect(settings.longBreakMinutes).toBe(15)
    expect(settings.longBreakInterval).toBe(4)
    expect(settings.theme).toBe("system")
    expect(settings.accent).toBe("red")
    expect(settings.soundEnabled).toBe(true)
    expect(settings.closeToTray).toBe(true)
    expect(settings.startAtLogin).toBe(false)
  })

  it("persists a patch and returns the merged settings", () => {
    const settings = writeSettings({ focusMinutes: 50, soundEnabled: false, theme: "dark" })

    expect(settings.focusMinutes).toBe(50)
    expect(settings.soundEnabled).toBe(false)
    expect(settings.theme).toBe("dark")
    expect(readSettings()).toEqual(settings)

    // Everything not mentioned keeps its default.
    expect(settings.longBreakMinutes).toBe(15)
  })

  it("clamps and drops anything unusable", () => {
    // Store known-good values first: an invalid patch must change none of them.
    writeSettings({ theme: "dark", accent: "purple", soundEnabled: true })

    const settings = writeSettings({
      focusMinutes: 999,
      shortBreakMinutes: -3,
      longBreakInterval: 100,
      theme: "neon",
      accent: "chartreuse",
      soundEnabled: "yes",
      nonsense: 42,
    })

    expect(settings.focusMinutes).toBe(120)
    expect(settings.shortBreakMinutes).toBe(1)
    expect(settings.longBreakInterval).toBe(8)
    expect(settings.theme).toBe("dark")
    expect(settings.accent).toBe("purple")
    expect(settings.soundEnabled).toBe(true)
    expect(Object.keys(settings)).not.toContain("nonsense")
  })

  it("round-trips internal bookkeeping values untouched", () => {
    writeRawSetting("timer_state", '{"phase":"focus"}')

    expect(readRawSetting("timer_state")).toBe('{"phase":"focus"}')
    expect(readRawSetting("missing")).toBeNull()

    writeRawSetting("timer_state", null)
    expect(readRawSetting("timer_state")).toBeNull()
  })
})

describe("project repository", () => {
  it("creates a project with defaults", () => {
    const project = createProject({ name: "  Thesis  " })

    expect(project.name).toBe("Thesis")
    expect(project.icon).toBe("folder")
    expect(project.color).toBe("blue")
  })

  it("refuses a project without a name", () => {
    expect(() => createProject({ name: "  " })).toThrow(/name/i)
  })

  it("detaches tasks when a project is deleted", () => {
    const project = createProject({ name: "Thesis" })
    const task = createTask({ title: "Chapter 1", projectId: project.id })

    deleteProject(project.id)

    expect(getTask(task.id)!.projectId).toBeNull()
  })

  it("seeds School / Music / Personal exactly once", () => {
    // The seed flag was set in beforeAll, so this call is a no-op.
    const before = listProjects().length
    ensureStarterProjects()

    expect(listProjects()).toHaveLength(before)
    expect(listProjects().map((project) => project.name)).toEqual(
      expect.arrayContaining(["School", "Music", "Personal"])
    )
  })

  it("does not bring the starter projects back once they are deleted", () => {
    for (const project of listProjects()) deleteProject(project.id)
    expect(listProjects()).toHaveLength(0)

    ensureStarterProjects()

    expect(listProjects()).toHaveLength(0)
  })
})
