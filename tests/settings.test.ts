import { describe, expect, it } from "vitest"

import { DEFAULT_SETTINGS, PALETTES, SOUND_THEMES } from "@/lib/constants"
import { mergeSettings, sanitizeSettings } from "@/lib/settings"
import type { AppSettings } from "@/types/settings"

describe("sanitizeSettings", () => {
  it("keeps only the keys the app knows", () => {
    const sanitized = sanitizeSettings({ theme: "dark", nonsense: true, __proto__: { evil: 1 } })

    expect(sanitized).toEqual({ theme: "dark" })
  })

  it("drops values of the wrong type", () => {
    expect(sanitizeSettings({ soundEnabled: "yes", focusMinutes: "30" })).toEqual({})
    expect(sanitizeSettings("not an object")).toEqual({})
    expect(sanitizeSettings(null)).toEqual({})
  })

  it("accepts every documented palette and sound theme", () => {
    for (const palette of PALETTES) {
      expect(sanitizeSettings({ palette: palette.id })).toEqual({ palette: palette.id })
    }
    for (const theme of SOUND_THEMES) {
      expect(sanitizeSettings({ soundTheme: theme.id })).toEqual({ soundTheme: theme.id })
    }
  })

  it("rejects an unknown palette or sound theme", () => {
    expect(sanitizeSettings({ palette: "neon", soundTheme: "airhorn" })).toEqual({})
  })

  it("clamps the sound volume into range", () => {
    expect(sanitizeSettings({ soundVolume: -20 })).toEqual({ soundVolume: 0 })
    expect(sanitizeSettings({ soundVolume: 480 })).toEqual({ soundVolume: 100 })
    expect(sanitizeSettings({ soundVolume: 42.6 })).toEqual({ soundVolume: 43 })
    expect(sanitizeSettings({ soundVolume: Number.NaN })).toEqual({})
  })

  it("clamps the timer durations into their sliders", () => {
    const sanitized = sanitizeSettings({
      focusMinutes: 1,
      shortBreakMinutes: 900,
      longBreakMinutes: 15,
      longBreakInterval: 0,
    })

    expect(sanitized).toEqual({
      focusMinutes: 5,
      shortBreakMinutes: 30,
      longBreakMinutes: 15,
      longBreakInterval: 2,
    })
  })
})

describe("mergeSettings", () => {
  it("returns the defaults for an empty patch", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, {})).toEqual(DEFAULT_SETTINGS)
  })

  it("applies a valid patch on top of the stored settings", () => {
    const stored = { ...DEFAULT_SETTINGS, focusMinutes: 50 }
    const merged = mergeSettings(stored, { focusMinutes: 25, palette: "warm" })

    expect(merged.focusMinutes).toBe(25)
    expect(merged.palette).toBe("warm")
    // Untouched keys survive.
    expect(merged.longBreakInterval).toBe(DEFAULT_SETTINGS.longBreakInterval)
  })

  it("leaves a stored value alone when the patch is invalid", () => {
    const stored: AppSettings = { ...DEFAULT_SETTINGS, palette: "cool", soundVolume: 30 }
    const merged = mergeSettings(stored, { palette: "neon", soundVolume: "loud" })

    expect(merged.palette).toBe("cool")
    expect(merged.soundVolume).toBe(30)
  })
})
