import { ACCENT_PRESETS, DEFAULT_SETTINGS, TIMER_LIMITS } from "@/lib/constants"
import type { AccentPresetId, AppSettings, ThemeMode } from "@/types/settings"

const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "system"]

const ACCENT_IDS: readonly AccentPresetId[] = ACCENT_PRESETS.map((preset) => preset.id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function clampInt(value: unknown, limit: { min: number; max: number }): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  return Math.min(limit.max, Math.max(limit.min, Math.round(value)))
}

/**
 * Keeps stored or user-supplied settings inside the range the app can render.
 * Unknown keys are dropped, so a corrupt row can never break the UI.
 */
export function sanitizeSettings(input: unknown): Partial<AppSettings> {
  if (!isRecord(input)) return {}

  const result: Partial<AppSettings> = {}

  if (THEME_MODES.includes(input.theme as ThemeMode)) {
    result.theme = input.theme as ThemeMode
  }

  if (ACCENT_IDS.includes(input.accent as AccentPresetId)) {
    result.accent = input.accent as AccentPresetId
  }

  const focusMinutes = clampInt(input.focusMinutes, TIMER_LIMITS.focusMinutes)
  if (focusMinutes !== undefined) result.focusMinutes = focusMinutes

  const shortBreakMinutes = clampInt(input.shortBreakMinutes, TIMER_LIMITS.shortBreakMinutes)
  if (shortBreakMinutes !== undefined) result.shortBreakMinutes = shortBreakMinutes

  const longBreakMinutes = clampInt(input.longBreakMinutes, TIMER_LIMITS.longBreakMinutes)
  if (longBreakMinutes !== undefined) result.longBreakMinutes = longBreakMinutes

  const longBreakInterval = clampInt(input.longBreakInterval, TIMER_LIMITS.longBreakInterval)
  if (longBreakInterval !== undefined) result.longBreakInterval = longBreakInterval

  for (const key of [
    "notifyOnFocusComplete",
    "notifyOnBreakComplete",
    "soundEnabled",
    "startAtLogin",
    "closeToTray",
    "autoStartNextSession",
  ] as const) {
    const value = input[key]
    if (typeof value === "boolean") result[key] = value
  }

  return result
}

/** Defaults merged with a sanitized patch — the single source of truth for settings shape. */
export function mergeSettings(base: AppSettings, patch: unknown): AppSettings {
  return { ...base, ...sanitizeSettings(patch) }
}

export { DEFAULT_SETTINGS }
