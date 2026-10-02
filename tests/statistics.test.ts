import { describe, expect, it } from "vitest"

import { countLongestStreakDays, countStreakDays, pickBestDay } from "@/lib/statistics"

/** The reference day every case counts back from: Wednesday, 4 March 2026. */
const TODAY = new Date(2026, 2, 4, 10, 0, 0)

describe("countStreakDays", () => {
  it("is zero without any session", () => {
    expect(countStreakDays([], TODAY)).toBe(0)
  })

  it("counts today on its own", () => {
    expect(countStreakDays(["2026-03-04"], TODAY)).toBe(1)
  })

  it("counts back through consecutive days", () => {
    expect(countStreakDays(["2026-03-04", "2026-03-03", "2026-03-02"], TODAY)).toBe(3)
  })

  it("keeps a streak that is still alive yesterday", () => {
    // Nothing finished yet today, but yesterday's work still counts (plan.md §14).
    expect(countStreakDays(["2026-03-03"], TODAY)).toBe(1)
    expect(countStreakDays(["2026-03-03", "2026-03-02"], TODAY)).toBe(2)
  })

  it("ends a streak that stopped before yesterday", () => {
    expect(countStreakDays(["2026-03-02", "2026-03-01"], TODAY)).toBe(0)
    expect(countStreakDays(["2026-02-20"], TODAY)).toBe(0)
  })

  it("ignores days from the future", () => {
    expect(countStreakDays(["2026-03-10", "2026-03-04"], TODAY)).toBe(1)
  })

  it("stops at the first gap", () => {
    const days = ["2026-03-04", "2026-03-03", "2026-03-01", "2026-02-28"]

    expect(countStreakDays(days, TODAY)).toBe(2)
  })

  it("accepts a set, unsorted input and duplicates alike", () => {
    expect(countStreakDays(new Set(["2026-03-04", "2026-03-03"]), TODAY)).toBe(2)
    expect(countStreakDays(["2026-03-03", "2026-03-04", "2026-03-03"], TODAY)).toBe(2)
  })

  it("counts across a month boundary", () => {
    expect(
      countStreakDays(["2026-03-01", "2026-02-28", "2026-02-27"], new Date(2026, 2, 1, 9, 0, 0))
    ).toBe(3)
  })

  it("counts across a year boundary", () => {
    expect(
      countStreakDays(["2026-01-01", "2025-12-31"], new Date(2026, 0, 1, 9, 0, 0))
    ).toBe(2)
  })
})

describe("countLongestStreakDays", () => {
  it("is zero without any day", () => {
    expect(countLongestStreakDays([])).toBe(0)
  })

  it("is one for a single day", () => {
    expect(countLongestStreakDays(["2026-03-04"])).toBe(1)
  })

  it("finds the longest run, not the current one", () => {
    // A four-day run earlier, a two-day run now.
    expect(
      countLongestStreakDays([
        "2026-03-10",
        "2026-03-09",
        "2026-03-08",
        "2026-03-07",
        "2026-03-02",
        "2026-03-01",
      ])
    ).toBe(4)
  })

  it("handles unsorted input and duplicates", () => {
    expect(countLongestStreakDays(["2026-03-02", "2026-03-01", "2026-03-02"])).toBe(2)
  })

  it("counts across month and year boundaries", () => {
    expect(countLongestStreakDays(["2026-02-28", "2026-03-01", "2026-03-02"])).toBe(3)
    expect(countLongestStreakDays(["2025-12-31", "2026-01-01"])).toBe(2)
  })

  it("ignores unstored days in the middle", () => {
    expect(countLongestStreakDays(["2026-03-01", "2026-03-02", "2026-03-05"])).toBe(2)
  })
})

describe("pickBestDay", () => {
  const day = (date: string, focusSessions: number, focusMs: number) => ({
    date,
    focusSessions,
    focusMs,
  })

  it("is null when nothing was finished", () => {
    expect(pickBestDay([])).toBeNull()
    expect(pickBestDay([day("2026-03-04", 0, 0), day("2026-03-03", 0, 0)])).toBeNull()
  })

  it("picks the day with the most sessions", () => {
    const best = pickBestDay([
      day("2026-03-02", 2, 3_000_000),
      day("2026-03-03", 4, 1_000_000),
      day("2026-03-04", 1, 9_000_000),
    ])

    expect(best?.date).toBe("2026-03-03")
  })

  it("breaks a tie on focus time, then on the earliest day", () => {
    const byTime = pickBestDay([day("2026-03-02", 3, 1_000), day("2026-03-03", 3, 5_000)])
    expect(byTime?.date).toBe("2026-03-03")

    const byDate = pickBestDay([day("2026-03-02", 3, 5_000), day("2026-03-03", 3, 5_000)])
    expect(byDate?.date).toBe("2026-03-02")
  })

  it("ignores the zero days when picking", () => {
    const best = pickBestDay([day("2026-03-02", 0, 0), day("2026-03-03", 1, 60_000)])

    expect(best?.date).toBe("2026-03-03")
  })
})
