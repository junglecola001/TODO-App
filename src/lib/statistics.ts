import { addDays, differenceInCalendarDays, startOfDay } from "date-fns"

import { toDateKey } from "@/lib/dates"

/** The minimum a day needs for the two helpers below to judge it. */
export interface FocusDay {
  date: string
  focusSessions: number
  focusMs: number
}

/**
 * Consecutive days with at least one focus session, counting back from today
 * (plan.md §14).
 *
 * A day that has no session *yet* does not break a streak that is still alive
 * yesterday — finishing a pomodoro today simply extends it. A gap older than
 * yesterday ends it.
 *
 * Kept as a pure function so the rule is testable without a database: the
 * repository only supplies which days have sessions.
 */
export function countStreakDays(dayKeys: Iterable<string>, reference: Date = new Date()): number {
  const days = dayKeys instanceof Set ? dayKeys : new Set(dayKeys)
  if (days.size === 0) return 0

  const today = startOfDay(reference)
  const todayKey = toDateKey(today)
  const yesterdayKey = toDateKey(addDays(today, -1))

  // The streak may start today or yesterday — anything older is already broken.
  let cursor = days.has(todayKey) ? today : days.has(yesterdayKey) ? addDays(today, -1) : null
  if (!cursor) return 0

  let streak = 0
  while (days.has(toDateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

/**
 * The longest run of consecutive days in the given set, wherever it sits.
 * `countStreakDays` answers "how long is the streak right now"; this answers
 * "what was the best run" for the reported window.
 */
export function countLongestStreakDays(dayKeys: Iterable<string>): number {
  const days = [...new Set(dayKeys)].sort()
  if (days.length === 0) return 0

  let longest = 1
  let current = 1

  for (let index = 1; index < days.length; index += 1) {
    const gap = differenceInCalendarDays(new Date(days[index]!), new Date(days[index - 1]!))

    if (gap === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else if (gap > 1) {
      current = 1
    }
    // gap === 0 cannot happen: the days are unique.
  }

  return longest
}

/**
 * The busiest day of a window: most focus sessions first, then the most focus
 * time, then the earliest day. Returns null when no day had a session.
 */
export function pickBestDay<T extends FocusDay>(days: readonly T[]): T | null {
  let best: T | null = null

  for (const day of days) {
    if (day.focusSessions <= 0) continue
    if (
      best === null ||
      day.focusSessions > best.focusSessions ||
      (day.focusSessions === best.focusSessions && day.focusMs > best.focusMs)
    ) {
      best = day
    }
  }

  return best
}
