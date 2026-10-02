import { addDays, startOfDay } from "date-fns"

import { toDateKey } from "@/lib/dates"
import { countLongestStreakDays, countStreakDays, pickBestDay } from "@/lib/statistics"
import type {
  BestDayStat,
  DailyStat,
  ProjectFocusStat,
  StatisticsSummary,
} from "@/types/statistics"
import type { AccentPresetId } from "@/types/settings"

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

interface ProjectRow {
  project_id: string | null
  name: string | null
  color: string | null
  sessions: number
  total_ms: number
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
    createdTasks: countCreatedTasks(since),
    averageFocusMs: focusSessions > 0 ? Math.round(focusMs / focusSessions) : 0,
    streakDays: getStreakDays(),
    longestStreakDays: countLongestStreakDays(
      daily.filter((day) => day.focusSessions > 0).map((day) => day.date)
    ),
    bestDay: pickBestDay(daily) as BestDayStat | null,
    byProject: getFocusByProject(since),
    daily,
  }
}

/** Tasks created inside the window — the other half of "what did I get done". */
function countCreatedTasks(since: number): number {
  const row = getSqlite()
    .prepare("SELECT COUNT(*) AS created FROM tasks WHERE created_at >= ?")
    .get(since) as { created: number }

  return row.created
}

/**
 * Focus time split by project, busiest first. Sessions are joined through their
 * task: a session with no task, or a task with no project, lands in a single
 * "No project" bucket rather than being dropped.
 */
function getFocusByProject(since: number): ProjectFocusStat[] {
  const rows = getSqlite()
    .prepare(
      `SELECT projects.id AS project_id,
              projects.name AS name,
              projects.color AS color,
              COUNT(*) AS sessions,
              COALESCE(SUM(sessions.duration), 0) AS total_ms
         FROM pomodoro_sessions AS sessions
         LEFT JOIN tasks ON tasks.id = sessions.task_id
         LEFT JOIN projects ON projects.id = tasks.project_id
        WHERE sessions.type = 'focus' AND sessions.started_at >= ?
        GROUP BY projects.id
        ORDER BY total_ms DESC, name ASC`
    )
    .all(since) as ProjectRow[]

  return rows.map((row) => ({
    projectId: row.project_id,
    name: row.name ?? "No project",
    color: (row.color as AccentPresetId | null) ?? null,
    focusSessions: row.sessions,
    focusMs: row.total_ms,
  }))
}

/**
 * The days that have at least one focus session, newest first. The streak rule
 * itself lives in `@/lib/statistics` so it can be tested without a database.
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

  return countStreakDays(rows.map((row) => row.day))
}

function clampRange(value: number): number {
  if (!Number.isFinite(value)) return 7
  return Math.min(MAX_RANGE_DAYS, Math.max(MIN_RANGE_DAYS, Math.round(value)))
}
