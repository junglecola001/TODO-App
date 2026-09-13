export interface DailyStat {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string
  focusSessions: number
  focusMs: number
  completedTasks: number
}

export interface StatisticsSummary {
  /** Number of days covered, including today. */
  rangeDays: number
  focusSessions: number
  focusMs: number
  completedTasks: number
  /** Mean length of a focus session in ms; 0 when there were none. */
  averageFocusMs: number
  /** Consecutive days ending today (or yesterday) with at least one focus session. */
  streakDays: number
  daily: DailyStat[]
}
