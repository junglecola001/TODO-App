import type { AccentPresetId } from "@/types/settings"

export interface DailyStat {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string
  focusSessions: number
  focusMs: number
  completedTasks: number
}

/** The busiest day inside the reported window. */
export interface BestDayStat {
  date: string
  focusSessions: number
  focusMs: number
}

/** Focus time attributed to one project, or to everything without one. */
export interface ProjectFocusStat {
  /** null for sessions with no task, or whose task has no project. */
  projectId: string | null
  name: string
  /** Accent preset the project uses, or null for the unassigned bucket. */
  color: AccentPresetId | null
  focusSessions: number
  focusMs: number
}

export interface StatisticsSummary {
  /** Number of days covered, including today. */
  rangeDays: number
  focusSessions: number
  focusMs: number
  completedTasks: number
  /** Tasks created inside the window, for a sense of throughput. */
  createdTasks: number
  /** Mean length of a focus session in ms; 0 when there were none. */
  averageFocusMs: number
  /** Consecutive days ending today (or yesterday) with at least one focus session. */
  streakDays: number
  /** Longest run of consecutive focus days inside the window. */
  longestStreakDays: number
  /** The day with the most focus sessions, or null when there were none. */
  bestDay: BestDayStat | null
  /** Focus time per project, busiest first. */
  byProject: ProjectFocusStat[]
  daily: DailyStat[]
}
