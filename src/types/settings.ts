export type ThemeMode = "light" | "dark" | "system"

export type AccentPresetId = "red" | "orange" | "blue" | "purple" | "green"

/**
 * Neutral-token palettes (plan.md §37 "More themes"). The accent color stays
 * independent: it is applied as `--primary` at runtime and never tints the
 * surfaces.
 */
export type PaletteId = "default" | "warm" | "cool"

/** Which synthesised sound family the four chimes come from. */
export type SoundThemeId = "bell" | "chime" | "click" | "minimal"

/**
 * Everything the user can change in Settings. Persisted in the `settings` table
 * as key/value rows so new options can be added without a migration.
 */
export interface AppSettings {
  theme: ThemeMode
  accent: AccentPresetId
  palette: PaletteId

  /** Timer durations, in minutes. */
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  /** Number of focus sessions before a long break. */
  longBreakInterval: number

  notifyOnFocusComplete: boolean
  notifyOnBreakComplete: boolean
  soundEnabled: boolean
  soundTheme: SoundThemeId
  /** Playback level, 0-100. */
  soundVolume: number

  startAtLogin: boolean
  closeToTray: boolean
  autoStartNextSession: boolean
  /** Off by default: the check is a network request, so the user opts in. */
  autoUpdateCheck: boolean
}
