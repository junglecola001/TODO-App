import { addDays, differenceInCalendarDays, format, isWeekend, parseISO, startOfDay } from "date-fns"

/** Local calendar date as `YYYY-MM-DD` — the format stored in the database. */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function tomorrowKey(): string {
  return toDateKey(addDays(new Date(), 1))
}

/** Saturday of the current week (today when it is already the weekend). */
export function thisWeekendKey(): string {
  const today = startOfDay(new Date())
  if (isWeekend(today)) return toDateKey(today)
  const daysUntilSaturday = 6 - today.getDay()
  return toDateKey(addDays(today, daysUntilSaturday))
}

/** Monday of next week. */
export function nextWeekKey(): string {
  const today = startOfDay(new Date())
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7
  return toDateKey(addDays(today, daysUntilMonday))
}

export function parseDateKey(key: string): Date {
  return parseISO(key)
}

/** Days until a due date: negative means overdue, 0 means today. */
export function daysUntil(key: string): number {
  return differenceInCalendarDays(parseDateKey(key), startOfDay(new Date()))
}

export function isToday(key: string | null): boolean {
  return key !== null && key === todayKey()
}

export function isOverdue(key: string | null): boolean {
  return key !== null && daysUntil(key) < 0
}

export function isUpcoming(key: string | null): boolean {
  return key !== null && daysUntil(key) > 0
}

/**
 * Short, human due-date label: "Today", "Tomorrow", "Sat", "Mar 4".
 * Overdue dates are returned as-is and styled by the caller.
 */
export function formatDueDate(key: string): string {
  const days = daysUntil(key)

  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days === -1) return "Yesterday"

  const date = parseDateKey(key)

  if (days > 1 && days < 7) return format(date, "EEE")
  if (date.getFullYear() === new Date().getFullYear()) return format(date, "MMM d")

  return format(date, "MMM d, yyyy")
}

/** Long form for tooltips and the task detail dialog. */
export function formatFullDate(key: string): string {
  return format(parseDateKey(key), "EEEE, MMMM d, yyyy")
}

export function formatClock(timestamp: number): string {
  return format(new Date(timestamp), "HH:mm")
}

/** `12h 35m`, or `45m` under an hour. Used by Statistics. */
export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
