export type ThemeMode = "light" | "dark" | "system"

export type AccentPresetId = "red" | "orange" | "blue" | "purple" | "green"

/**
 * Everything the user can change in Settings. Persisted in the `settings` table
 * as key/value rows so new options can be added without a migration.
 */
export interface AppSettings {
  theme: ThemeMode
  accent: AccentPresetId

  /** Timer durations, in minutes. */
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  /** Number of focus sessions before a long break. */
  longBreakInterval: number

  notifyOnFocusComplete: boolean
  notifyOnBreakComplete: boolean
  soundEnabled: boolean

  startAtLogin: boolean
  closeToTray: boolean
  autoStartNextSession: boolean
}
