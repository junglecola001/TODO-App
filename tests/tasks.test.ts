import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import {
  countCompletedToday,
  groupByDueDate,
  isTaskOverdue,
  selectCompletedToday,
  selectInboxTasks,
  selectProjectTasks,
  selectTodayTasks,
  selectUpcomingTasks,
  sortTasks,
} from "@/lib/tasks"

import { makeTask } from "./helpers"

/** Wednesday, 4 March 2026, 10:00 local time. */
const NOW = new Date(2026, 2, 4, 10, 0, 0).getTime()

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

describe("task views", () => {
  const undone = [
    makeTask({ id: "today", dueDate: "2026-03-04" }),
    makeTask({ id: "overdue", dueDate: "2026-03-01" }),
    makeTask({ id: "tomorrow", dueDate: "2026-03-05" }),
    makeTask({ id: "later", dueDate: "2026-03-20" }),
    makeTask({ id: "inbox" }),
  ]

  it("Today holds what is due today or already overdue", () => {
    expect(selectTodayTasks(undone).map((task) => task.id)).toEqual(["overdue", "today"])
  })

  it("Inbox holds what has no date yet", () => {
    expect(selectInboxTasks(undone).map((task) => task.id)).toEqual(["inbox"])
  })

  it("Upcoming holds everything after today", () => {
    expect(selectUpcomingTasks(undone).map((task) => task.id)).toEqual(["tomorrow", "later"])
  })

  it("leaves completed tasks out of all three views", () => {
    const tasks = [
      ...undone,
      makeTask({ id: "done-today", dueDate: "2026-03-04", completed: true, completedAt: NOW }),
      makeTask({ id: "done-dated", dueDate: "2026-03-05", completed: true, completedAt: NOW }),
      makeTask({ id: "done-inbox", completed: true, completedAt: NOW }),
    ]

    expect(selectTodayTasks(tasks).map((task) => task.id)).not.toContain("done-today")
    expect(selectUpcomingTasks(tasks).map((task) => task.id)).not.toContain("done-dated")
    expect(selectInboxTasks(tasks).map((task) => task.id)).not.toContain("done-inbox")
  })

  it("collects what was finished today, newest first", () => {
    const tasks = [
      makeTask({ id: "early", completed: true, completedAt: new Date(2026, 2, 4, 8, 0, 0).getTime() }),
      makeTask({ id: "late", completed: true, completedAt: new Date(2026, 2, 4, 9, 30, 0).getTime() }),
      makeTask({ id: "yesterday", completed: true, completedAt: new Date(2026, 2, 3, 23, 0, 0).getTime() }),
      makeTask({ id: "open" }),
    ]

    expect(selectCompletedToday(tasks).map((task) => task.id)).toEqual(["late", "early"])
    expect(countCompletedToday(tasks)).toBe(2)
  })

  it("selects only open tasks for a project", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1" }),
      makeTask({ id: "b", projectId: "p1", completed: true, completedAt: NOW }),
      makeTask({ id: "c", projectId: "p2" }),
    ]

    expect(selectProjectTasks(tasks, "p1").map((task) => task.id)).toEqual(["a"])
  })
})

describe("sortTasks", () => {
  it("orders by due date, so overdue work comes first", () => {
    const tasks = [
      makeTask({ id: "later", dueDate: "2026-03-20" }),
      makeTask({ id: "overdue", dueDate: "2026-03-01" }),
      makeTask({ id: "today", dueDate: "2026-03-04" }),
    ]

    expect(sortTasks(tasks).map((task) => task.id)).toEqual(["overdue", "today", "later"])
  })

  it("breaks a tie on priority, then on how new the task is", () => {
    const tasks = [
      makeTask({ id: "low", dueDate: "2026-03-04", priority: "low", createdAt: 100 }),
      makeTask({ id: "high-old", dueDate: "2026-03-04", priority: "high", createdAt: 100 }),
      makeTask({ id: "high-new", dueDate: "2026-03-04", priority: "high", createdAt: 200 }),
    ]

    expect(sortTasks(tasks).map((task) => task.id)).toEqual(["high-new", "high-old", "low"])
  })

  it("does not mutate the input array", () => {
    const tasks = [
      makeTask({ id: "b", dueDate: "2026-03-20" }),
      makeTask({ id: "a", dueDate: "2026-03-01" }),
    ]

    sortTasks(tasks)

    expect(tasks.map((task) => task.id)).toEqual(["b", "a"])
  })
})

describe("groupByDueDate", () => {
  it("groups by day in chronological order, skipping undated tasks", () => {
    const tasks = [
      makeTask({ id: "fri-b", dueDate: "2026-03-06", priority: "low" }),
      makeTask({ id: "wed", dueDate: "2026-03-04" }),
      makeTask({ id: "fri-a", dueDate: "2026-03-06", priority: "high" }),
      makeTask({ id: "none" }),
    ]

    const groups = groupByDueDate(tasks)

    expect(groups.map((group) => group.key)).toEqual(["2026-03-04", "2026-03-06"])
    expect(groups[1]!.tasks.map((task) => task.id)).toEqual(["fri-a", "fri-b"])
  })
})

describe("isTaskOverdue", () => {
  it("only counts open, dated, past work", () => {
    expect(isTaskOverdue(makeTask({ dueDate: "2026-03-03" }))).toBe(true)
    expect(isTaskOverdue(makeTask({ dueDate: "2026-03-04" }))).toBe(false)
    expect(isTaskOverdue(makeTask({ dueDate: "2026-03-05" }))).toBe(false)
    expect(isTaskOverdue(makeTask())).toBe(false)
    expect(
      isTaskOverdue(makeTask({ dueDate: "2026-03-03", completed: true, completedAt: NOW }))
    ).toBe(false)
  })
})
