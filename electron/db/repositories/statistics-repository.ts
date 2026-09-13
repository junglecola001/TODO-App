import { addDays, startOfDay } from "date-fns"

import { toDateKey } from "@/lib/dates"
import type { DailyStat, StatisticsSummary } from "@/types/statistics"

import { getSqlite } from "../index"

const MIN_RANGE_DAYS = 1
const MAX_RANGE_DAYS = 366
/** Upper bound when walking the streak backwards; also caps how far we scan. */
const STREAK_SCAN_DAYS = 400

interface FocusRow {
  day: string
  sessions: number
  total_ms: number
}

interface CompletedRow {
  day: string
  completed: number
}

/**
 * Statistics are aggregated in SQLite from `pomodoro_sessions` and `tasks`
 * (plan.md §13) — never from anything the renderer holds in memory.
 *
 * `started_at` and `completed_at` are epoch milliseconds, so they are converted
 * with SQLite's own `localtime` modifier: a pomodoro counts towards the day the
 * user actually sat down, not towards UTC.
 */
export function getStatistics(rangeDaysInput: number): StatisticsSummary {
  const rangeDays = clampRange(rangeDaysInput)
  const today = startOfDay(new Date())
  const since = addDays(today, -(rangeDays - 1)).getTime()

  const focusRows = getSqlite()
    .prepare(
      `SELECT date(started_at / 1000, 'unixepoch', 'localtime') AS day,
              COUNT(*) AS sessions,
              COALESCE(SUM(duration), 0) AS total_ms
         FROM pomodoro_sessions
        WHERE type = 'focus' AND started_at >= ?
        GROUP BY day`
    )
    .all(since) as FocusRow[]

  const completedRows = getSqlite()
    .prepare(
      `SELECT date(completed_at / 1000, 'unixepoch', 'localtime') AS day,
              COUNT(*) AS completed
         FROM tasks
        WHERE completed = 1 AND completed_at IS NOT NULL AND completed_at >= ?
        GROUP BY day`
    )
    .all(since) as CompletedRow[]

  const focusByDay = new Map(focusRows.map((row) => [row.day, row]))
  const completedByDay = new Map(completedRows.map((row) => [row.day, row.completed]))

  const daily: DailyStat[] = []
  for (let offset = 0; offset < rangeDays; offset += 1) {
    const key = toDateKey(addDays(today, -(rangeDays - 1 - offset)))
    const focus = focusByDay.get(key)

    daily.push({
      date: key,
      focusSessions: focus?.sessions ?? 0,
      focusMs: focus?.total_ms ?? 0,
      completedTasks: completedByDay.get(key) ?? 0,
    })
  }

  const focusSessions = daily.reduce((sum, day) => sum + day.focusSessions, 0)
  const focusMs = daily.reduce((sum, day) => sum + day.focusMs, 0)
  const completedTasks = daily.reduce((sum, day) => sum + day.completedTasks, 0)

  return {
    rangeDays,
    focusSessions,
    focusMs,
    completedTasks,
    averageFocusMs: focusSessions > 0 ? Math.round(focusMs / focusSessions) : 0,
    streakDays: getStreakDays(),
    daily,
  }
}

/**
 * Consecutive days with at least one focus session, counting back from today.
 * A day without a session yet does not break a streak that is still alive
 * yesterday (plan.md §14 keeps this deliberately light).
 */
function getStreakDays(): number {
  const rows = getSqlite()
    .prepare(
      `SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') AS day
         FROM pomodoro_sessions
        WHERE type = 'focus'
        ORDER BY day DESC
        LIMIT ?`
    )
    .all(STREAK_SCAN_DAYS) as Array<{ day: string }>

  const days = new Set(rows.map((row) => row.day))
  if (days.size === 0) return 0

  const today = startOfDay(new Date())
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

function clampRange(value: number): number {
  if (!Number.isFinite(value)) return 7
  return Math.min(MAX_RANGE_DAYS, Math.max(MIN_RANGE_DAYS, Math.round(value)))
}
