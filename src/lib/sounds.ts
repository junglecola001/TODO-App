"use client"

import { useSettingsStore } from "@/stores/settings-store"

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
 * code. Each one is a soft bell — sine or triangle, fast attack, long
 * exponential decay, never a beep.
 */
const SOUNDS: Record<SoundName, Tone[]> = {
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

/** Plays one of the four chimes, unless sounds are switched off in Settings. */
export function playSound(name: SoundName): void {
  if (!useSettingsStore.getState().settings.soundEnabled) return

  const context = getAudioContext()
  if (!context) return

  const startAt = context.currentTime + 0.01

  for (const tone of SOUNDS[name]) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = tone.type
    oscillator.frequency.value = tone.frequency

    const toneStart = startAt + tone.delay
    // Exponential ramps cannot touch zero, hence the tiny floor values.
    gain.gain.setValueAtTime(0.0001, toneStart)
    gain.gain.exponentialRampToValueAtTime(tone.gain, toneStart + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + tone.duration)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(toneStart)
    oscillator.stop(toneStart + tone.duration + 0.05)
  }
}
