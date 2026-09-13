import type { AccentPresetId, AppSettings } from "@/types/settings"

export const APP_NAME = "FocusFlow"
export const APP_TAGLINE = "Less UI, More Focus."

/** next-themes persists the appearance mode here (it must be readable before hydration). */
export const THEME_STORAGE_KEY = "focusflow-theme"

export interface AccentPreset {
  id: AccentPresetId
  label: string
  /** HSL channel triplet, assigned to `--primary` at runtime. */
  hsl: string
  /** The same color as hex, for previews and native UI. */
  hex: string
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: "red", label: "Red", hsl: "358 100% 67.6%", hex: "#FF5A5F" },
  { id: "orange", label: "Orange", hsl: "25 95% 53%", hex: "#F97316" },
  { id: "blue", label: "Blue", hsl: "217 91% 60%", hex: "#3B82F6" },
  { id: "purple", label: "Purple", hsl: "258 90% 66%", hex: "#8B5CF6" },
  { id: "green", label: "Green", hsl: "142 71% 45%", hex: "#22C55E" },
] as const

export const DEFAULT_ACCENT: AccentPresetId = "red"

export function accentPreset(id: AccentPresetId): AccentPreset {
  return ACCENT_PRESETS.find((preset) => preset.id === id) ?? ACCENT_PRESETS[0]!
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  accent: DEFAULT_ACCENT,

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,

  notifyOnFocusComplete: true,
  notifyOnBreakComplete: true,
  soundEnabled: true,

  startAtLogin: false,
  closeToTray: true,
  autoStartNextSession: false,
}

/** Guard rails for the duration sliders in Settings. */
export const TIMER_LIMITS = {
  focusMinutes: { min: 5, max: 120, step: 5 },
  shortBreakMinutes: { min: 1, max: 30, step: 1 },
  longBreakMinutes: { min: 5, max: 60, step: 5 },
  longBreakInterval: { min: 2, max: 8, step: 1 },
} as const

export const PRIORITIES = ["none", "low", "medium", "high"] as const

export type Priority = (typeof PRIORITIES)[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
}

/** Order used when sorting tasks; higher sorts first. */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
}
