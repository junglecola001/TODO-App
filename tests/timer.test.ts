import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { formatTimerClock, describeTimerClock } from "@/lib/timer"
import { timerRemainingMs } from "@/types/timer"

/**
 * Wednesday, 4 March 2026, 10:00 local time. Fixed so the clock in every
 * expectation is unambiguous.
 */
const NOW = new Date(2026, 2, 4, 10, 0, 0).getTime()

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

describe("formatTimerClock", () => {
  it("renders mm:ss", () => {
    expect(formatTimerClock(0)).toBe("00:00")
    expect(formatTimerClock(1_000)).toBe("00:01")
    expect(formatTimerClock(59_000)).toBe("00:59")
    expect(formatTimerClock(60_000)).toBe("01:00")
    expect(formatTimerClock(25 * 60_000)).toBe("25:00")
  })

  it("rounds partial seconds up, so a running clock never shows a second early", () => {
    expect(formatTimerClock(1)).toBe("00:01")
    expect(formatTimerClock(1_001)).toBe("00:02")
    expect(formatTimerClock(59_999)).toBe("01:00")
  })

  it("adds an hours field only when needed", () => {
    expect(formatTimerClock(3_600_000)).toBe("1:00:00")
    expect(formatTimerClock(3_661_000)).toBe("1:01:01")
    expect(formatTimerClock(59 * 60_000 + 59_000)).toBe("59:59")
  })

  it("never goes negative when a phase has overrun", () => {
    expect(formatTimerClock(-5_000)).toBe("00:00")
  })
})

describe("describeTimerClock", () => {
  it("spells the remaining time out for screen readers", () => {
    expect(describeTimerClock(0)).toBe("0 seconds")
    expect(describeTimerClock(1_000)).toBe("1 second")
    expect(describeTimerClock(60_000)).toBe("1 minute 0 seconds")
    expect(describeTimerClock(90_000)).toBe("1 minute 30 seconds")
    expect(describeTimerClock(24 * 60_000 + 37_000)).toBe("24 minutes 37 seconds")
  })
})

describe("timerRemainingMs", () => {
  const base = {
    phase: "focus" as const,
    durationMs: 1_500_000,
    taskId: null,
    completedFocusCount: 0,
  }

  it("derives the remaining time from the real clock while running", () => {
    const state = { ...base, status: "running" as const, startedAt: NOW, remainingMs: null }

    expect(timerRemainingMs(state, NOW)).toBe(1_500_000)
    expect(timerRemainingMs(state, NOW + 60_000)).toBe(1_440_000)
  })

  it("clamps at zero once the phase is over", () => {
    const state = { ...base, status: "running" as const, startedAt: NOW, remainingMs: null }

    expect(timerRemainingMs(state, NOW + 10_000_000)).toBe(0)
  })

  it("uses the frozen remainder while paused", () => {
    const state = { ...base, status: "paused" as const, startedAt: null, remainingMs: 42_000 }

    expect(timerRemainingMs(state, NOW)).toBe(42_000)
    expect(timerRemainingMs(state, NOW + 120_000)).toBe(42_000)
  })

  it("falls back to the full duration while idle", () => {
    const state = { ...base, status: "idle" as const, startedAt: null, remainingMs: null }

    expect(timerRemainingMs(state, NOW)).toBe(1_500_000)
  })
})
