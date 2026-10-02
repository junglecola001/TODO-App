import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import {
  daysUntil,
  formatClock,
  formatDueDate,
  formatDuration,
  formatFullDate,
  isOverdue,
  isToday,
  isUpcoming,
  nextWeekKey,
  thisWeekendKey,
  toDateKey,
  todayKey,
  tomorrowKey,
} from "@/lib/dates"

/** Wednesday, 4 March 2026, 10:00 local time. */
const NOW = new Date(2026, 2, 4, 10, 0, 0)

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

describe("date keys", () => {
  it("formats a local calendar date as YYYY-MM-DD", () => {
    expect(toDateKey(NOW)).toBe("2026-03-04")
    expect(toDateKey(new Date(2026, 0, 9, 23, 59))).toBe("2026-01-09")
  })

  it("resolves today and tomorrow", () => {
    expect(todayKey()).toBe("2026-03-04")
    expect(tomorrowKey()).toBe("2026-03-05")
  })

  it("points the weekend at the coming Saturday", () => {
    expect(thisWeekendKey()).toBe("2026-03-07")
  })

  it("returns today for the weekend shortcut once Saturday has arrived", () => {
    vi.setSystemTime(new Date(2026, 2, 7, 9, 0, 0))
    expect(thisWeekendKey()).toBe("2026-03-07")

    vi.setSystemTime(new Date(2026, 2, 8, 9, 0, 0))
    expect(thisWeekendKey()).toBe("2026-03-08")

    vi.setSystemTime(NOW)
  })

  it("points next week at the coming Monday", () => {
    expect(nextWeekKey()).toBe("2026-03-09")
  })

  it("rolls next week to Monday when today already is Monday", () => {
    vi.setSystemTime(new Date(2026, 2, 9, 8, 0, 0))
    expect(nextWeekKey()).toBe("2026-03-16")
    vi.setSystemTime(NOW)
  })
})

describe("relative day helpers", () => {
  it("counts whole days, negative when overdue", () => {
    expect(daysUntil("2026-03-04")).toBe(0)
    expect(daysUntil("2026-03-05")).toBe(1)
    expect(daysUntil("2026-03-03")).toBe(-1)
    expect(daysUntil("2026-03-11")).toBe(7)
  })

  it("classifies today, overdue and upcoming", () => {
    expect(isToday("2026-03-04")).toBe(true)
    expect(isToday("2026-03-05")).toBe(false)
    expect(isToday(null)).toBe(false)

    expect(isOverdue("2026-03-03")).toBe(true)
    expect(isOverdue("2026-03-04")).toBe(false)
    expect(isOverdue(null)).toBe(false)

    expect(isUpcoming("2026-03-05")).toBe(true)
    expect(isUpcoming("2026-03-04")).toBe(false)
    expect(isUpcoming(null)).toBe(false)
  })
})

describe("formatDueDate", () => {
  it("names the near days", () => {
    expect(formatDueDate("2026-03-04")).toBe("Today")
    expect(formatDueDate("2026-03-05")).toBe("Tomorrow")
    expect(formatDueDate("2026-03-03")).toBe("Yesterday")
  })

  it("uses the weekday inside the coming week", () => {
    expect(formatDueDate("2026-03-06")).toBe("Fri")
    expect(formatDueDate("2026-03-09")).toBe("Mon")
  })

  it("uses a short date beyond that", () => {
    expect(formatDueDate("2026-03-20")).toBe("Mar 20")
  })

  it("spells the year out when it is not the current one", () => {
    expect(formatDueDate("2027-03-04")).toBe("Mar 4, 2027")
  })

  it("has a long form for tooltips", () => {
    expect(formatFullDate("2026-03-04")).toBe("Wednesday, March 4, 2026")
  })
})

describe("formatDuration", () => {
  it("keeps minutes under an hour", () => {
    expect(formatDuration(0)).toBe("0m")
    expect(formatDuration(45 * 60_000)).toBe("45m")
  })

  it("drops empty units", () => {
    expect(formatDuration(60 * 60_000)).toBe("1h")
    expect(formatDuration(12 * 60 * 60_000 + 35 * 60_000)).toBe("12h 35m")
    expect(formatDuration(90 * 60_000)).toBe("1h 30m")
  })
})

describe("formatClock", () => {
  it("renders a 24-hour time", () => {
    expect(formatClock(new Date(2026, 2, 4, 9, 5).getTime())).toBe("09:05")
    expect(formatClock(new Date(2026, 2, 4, 21, 30).getTime())).toBe("21:30")
  })
})
