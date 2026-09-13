import type { TimerPhase } from "@/types/timer"

export const TIMER_PHASE_LABELS: Record<TimerPhase, string> = {
  focus: "Focus",
  short_break: "Short break",
  long_break: "Long break",
}

/** `24:37`, or `1:05:00` for very long phases. */
export function formatTimerClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

/** Spoken form for screen readers, e.g. "24 minutes 37 seconds". */
export function describeTimerClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`)
  parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`)
  return parts.join(" ")
}

function pad(value: number): string {
  return `${value}`.padStart(2, "0")
}
