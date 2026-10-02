"use client"

import { useSettingsStore } from "@/stores/settings-store"
import type { SoundThemeId } from "@/types/settings"

export type SoundName = "timerStart" | "focusComplete" | "breakComplete" | "taskComplete"

interface Tone {
  frequency: number
  /** Seconds after the start of the sound. */
  delay: number
  duration: number
  gain: number
  type: OscillatorType
}

/**
 * FocusFlow's sounds are synthesised with the Web Audio API rather than shipped
 * as files (plan.md §26): they stay tiny, need no assets, and can be tuned in
 * code. Every family is a soft bell, click or chime — fast attack, long
 * exponential decay, never a beep.
 *
 * Settings picks the family and the playback level; the tables below are the
 * whole palette (plan.md §37 "Custom sounds").
 */
const SOUND_THEMES: Record<SoundThemeId, Record<SoundName, Tone[]>> = {
  bell: {
    timerStart: [{ frequency: 587.33, delay: 0, duration: 0.22, gain: 0.07, type: "sine" }],
    focusComplete: [
      { frequency: 880, delay: 0, duration: 0.55, gain: 0.09, type: "sine" },
      { frequency: 1174.66, delay: 0.16, duration: 0.7, gain: 0.08, type: "sine" },
    ],
    breakComplete: [
      { frequency: 659.25, delay: 0, duration: 0.45, gain: 0.08, type: "sine" },
      { frequency: 987.77, delay: 0.14, duration: 0.6, gain: 0.07, type: "sine" },
    ],
    taskComplete: [{ frequency: 1046.5, delay: 0, duration: 0.16, gain: 0.05, type: "triangle" }],
  },

  chime: {
    timerStart: [{ frequency: 523.25, delay: 0, duration: 0.3, gain: 0.06, type: "sine" }],
    focusComplete: [
      { frequency: 587.33, delay: 0, duration: 0.6, gain: 0.07, type: "sine" },
      { frequency: 783.99, delay: 0.18, duration: 0.7, gain: 0.07, type: "sine" },
      { frequency: 1046.5, delay: 0.36, duration: 0.9, gain: 0.06, type: "sine" },
    ],
    breakComplete: [
      { frequency: 783.99, delay: 0, duration: 0.5, gain: 0.07, type: "sine" },
      { frequency: 587.33, delay: 0.2, duration: 0.8, gain: 0.06, type: "sine" },
    ],
    taskComplete: [{ frequency: 880, delay: 0, duration: 0.22, gain: 0.05, type: "sine" }],
  },

  click: {
    timerStart: [{ frequency: 1400, delay: 0, duration: 0.05, gain: 0.05, type: "triangle" }],
    focusComplete: [
      { frequency: 1200, delay: 0, duration: 0.06, gain: 0.06, type: "triangle" },
      { frequency: 1600, delay: 0.09, duration: 0.08, gain: 0.05, type: "triangle" },
    ],
    breakComplete: [
      { frequency: 900, delay: 0, duration: 0.06, gain: 0.06, type: "triangle" },
      { frequency: 1300, delay: 0.1, duration: 0.08, gain: 0.05, type: "triangle" },
    ],
    taskComplete: [{ frequency: 1500, delay: 0, duration: 0.05, gain: 0.04, type: "triangle" }],
  },

  minimal: {
    timerStart: [{ frequency: 392, delay: 0, duration: 0.2, gain: 0.05, type: "sine" }],
    focusComplete: [{ frequency: 440, delay: 0, duration: 0.7, gain: 0.06, type: "sine" }],
    breakComplete: [{ frequency: 349.23, delay: 0, duration: 0.7, gain: 0.06, type: "sine" }],
    taskComplete: [{ frequency: 523.25, delay: 0, duration: 0.18, gain: 0.04, type: "sine" }],
  },
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null

  if (!audioContext) {
    const Ctor = window.AudioContext
    if (!Ctor) return null
    audioContext = new Ctor()
  }

  // Electron allows autoplay, but the context can still be suspended after the
  // machine wakes from sleep.
  if (audioContext.state === "suspended") {
    void audioContext.resume()
  }

  return audioContext
}

/**
 * Plays one of the four chimes, unless sounds are switched off in Settings.
 * The current family and volume are read from the settings store on every call,
 * so a change takes effect on the next sound instead of needing a reload.
 */
export function playSound(name: SoundName): void {
  const settings = useSettingsStore.getState().settings
  if (!settings.soundEnabled) return

  const context = getAudioContext()
  if (!context) return

  const tones = SOUND_THEMES[settings.soundTheme]?.[name] ?? SOUND_THEMES.bell[name]
  const volume = Math.min(100, Math.max(0, settings.soundVolume)) / 100
  if (volume === 0) return

  const startAt = context.currentTime + 0.01

  for (const tone of tones) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = tone.type
    oscillator.frequency.value = tone.frequency

    const peak = tone.gain * volume
    const toneStart = startAt + tone.delay
    // Exponential ramps cannot touch zero, hence the tiny floor values.
    gain.gain.setValueAtTime(0.0001, toneStart)
    gain.gain.exponentialRampToValueAtTime(peak, toneStart + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + tone.duration)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(toneStart)
    oscillator.stop(toneStart + tone.duration + 0.05)
  }
}
