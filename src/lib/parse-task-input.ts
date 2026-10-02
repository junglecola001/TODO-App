import { addDays, addWeeks, isValid, parseISO, startOfDay } from "date-fns"

import type { Priority } from "@/lib/constants"
import { nextWeekKey, thisWeekendKey, toDateKey, todayKey, tomorrowKey } from "@/lib/dates"
import type { Project } from "@/types/domain"

export interface ParsedTaskInput {
  /** Whatever is left after the recognised tokens are removed. */
  title: string
  dueDate: string | null
  priority: Priority
  projectId: string | null
  estimatedPomodoros: number
  /** Which tokens were recognised — the quick add dialog previews these. */
  matched: {
    dueDate: boolean
    priority: boolean
    project: boolean
    estimatedPomodoros: boolean
  }
}

const FULL_WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

/**
 * Abbreviations only count when a date word introduces them ("on mon",
 * "by fri"): on their own they collide with ordinary words like "I sat down".
 */
const SHORT_WEEKDAYS: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
}

const WEEKDAY_NAMES = `${Object.keys(FULL_WEEKDAYS).join("|")}|${Object.keys(SHORT_WEEKDAYS).join("|")}`

/** "on friday", "by fri", "due monday" — the word is part of the token. */
const DATE_PREFIX = "(?:on|by|due|until|before)"

const PRIORITY_TOKENS: Record<string, Priority> = {
  "!high": "high",
  "!medium": "medium",
  "!med": "medium",
  "!low": "low",
  "!none": "none",
}

const PRIORITY_SHORTHAND: Record<string, Priority> = {
  "!!!": "high",
  "!!": "medium",
  "!": "low",
}

const POMODORO_WORDS = /(?:\s)(\d{1,2})\s*(?:pomodoros?|pomos?)(?=[\s.,!?]|$)/i

/**
 * Parses the small, predictable slice of natural language the quick add field
 * understands:
 *
 *   "Finish homework tomorrow"        -> dueDate = tomorrow
 *   "Practice piano !high"            -> priority = high
 *   "Read chapter 3 #School ~2"       -> project + 2 estimated pomodoros
 *   "Essay next friday"               -> dueDate = the friday of next week
 *   "Call mum in 2 weeks"             -> dueDate = 14 days out
 *   "Draft the report 3 pomodoros"    -> estimatedPomodoros = 3
 *   "Submit by 2026-03-20"            -> dueDate = that exact day
 *
 * Anything it does not recognise stays part of the title, so a failed parse can
 * never stop a task from being created.
 */
export function parseTaskInput(raw: string, projects: Project[]): ParsedTaskInput {
  // Padded so every token pattern can require surrounding whitespace.
  let text = ` ${raw.trim()} `

  const result: ParsedTaskInput = {
    title: raw.trim(),
    dueDate: null,
    priority: "none",
    projectId: null,
    estimatedPomodoros: 0,
    matched: { dueDate: false, priority: false, project: false, estimatedPomodoros: false },
  }

  const priorityMatch = text.match(/\s(!high|!medium|!med|!low|!none|!!!|!!|!)\s/i)
  if (priorityMatch) {
    const token = priorityMatch[1]!.toLowerCase()
    result.priority = PRIORITY_TOKENS[token] ?? PRIORITY_SHORTHAND[token] ?? "none"
    result.matched.priority = true
    text = text.replace(priorityMatch[0], " ")
  }

  const pomodoroMatch = text.match(/\s~(\d{1,2})(?=[\s.,!?]|$)/) ?? text.match(POMODORO_WORDS)
  if (pomodoroMatch) {
    result.estimatedPomodoros = Number(pomodoroMatch[1])
    result.matched.estimatedPomodoros = true
    text = text.replace(pomodoroMatch[0], " ")
  }

  const projectMatch = matchProject(text, projects)
  if (projectMatch) {
    result.projectId = projectMatch.project.id
    result.matched.project = true
    text = text.replace(projectMatch.raw, " ")
  }

  const dateMatch = matchDate(text)
  if (dateMatch) {
    result.dueDate = dateMatch.key
    result.matched.dueDate = true
    text = text.replace(dateMatch.raw, " ")
  }

  const title = text.replace(/\s+/g, " ").trim()
  result.title = title || raw.trim()

  return result
}

function matchDate(text: string): { raw: string; key: string } | null {
  // An explicit calendar date wins over any wording.
  const explicit = text.match(/\s(\d{4}-\d{2}-\d{2})(?![\d-])/)
  if (explicit) {
    const parsed = parseISO(explicit[1]!)
    if (isValid(parsed)) return { raw: explicit[0], key: toDateKey(parsed) }
  }

  // Longest phrases first: "day after tomorrow" contains "tomorrow".
  const phrases: Array<{ pattern: RegExp; key: () => string }> = [
    { pattern: new RegExp(`\\s${DATE_PREFIX}?\\s*day\\s+after\\s+tomorrow\\s`, "i"), key: () => toDateKey(addDays(new Date(), 2)) },
    { pattern: new RegExp(`\\s${DATE_PREFIX}?\\s*(?:today|tonight)\\s`, "i"), key: todayKey },
    { pattern: new RegExp(`\\s${DATE_PREFIX}?\\s*tomorrow\\s`, "i"), key: tomorrowKey },
    { pattern: new RegExp(`\\s${DATE_PREFIX}?\\s*(?:this\\s+|next\\s+)?weekend\\s`, "i"), key: thisWeekendKey },
    { pattern: /\snext\s+week\b/i, key: nextWeekKey },
  ]

  for (const phrase of phrases) {
    const match = text.match(phrase.pattern)
    if (match) return { raw: match[0], key: phrase.key() }
  }

  const nextWeekday = text.match(new RegExp(`\\snext\\s+(${WEEKDAY_NAMES})\\b`, "i"))
  if (nextWeekday) {
    const name = nextWeekday[1]!.toLowerCase()
    const weekday = FULL_WEEKDAYS[name] ?? SHORT_WEEKDAYS[name]!
    return { raw: nextWeekday[0], key: weekdayOfNextWeek(weekday) }
  }

  const inDays = text.match(/\sin\s+(\d{1,2})\s+days?\b/i)
  if (inDays) {
    return { raw: inDays[0], key: toDateKey(addDays(new Date(), Number(inDays[1]))) }
  }

  const inWeeks = text.match(/\sin\s+(\d{1,2})\s+weeks?\b/i)
  if (inWeeks) {
    return { raw: inWeeks[0], key: toDateKey(addWeeks(new Date(), Number(inWeeks[1]))) }
  }

  if (/\sin\s+a\s+week\b/i.test(text)) {
    return { raw: text.match(/\sin\s+a\s+week\b/i)![0], key: toDateKey(addWeeks(new Date(), 1)) }
  }

  const prefixedWeekday = text.match(new RegExp(`\\s${DATE_PREFIX}\\s+(${WEEKDAY_NAMES})\\b`, "i"))
  if (prefixedWeekday) {
    const name = prefixedWeekday[1]!.toLowerCase()
    const weekday = FULL_WEEKDAYS[name] ?? SHORT_WEEKDAYS[name]!
    return { raw: prefixedWeekday[0], key: weekdayKey(weekday) }
  }

  const bareWeekday = text.match(new RegExp(`\\s(${Object.keys(FULL_WEEKDAYS).join("|")})\\b`, "i"))
  if (bareWeekday) {
    const weekday = FULL_WEEKDAYS[bareWeekday[1]!.toLowerCase()]!
    return { raw: bareWeekday[0], key: weekdayKey(weekday) }
  }

  return null
}

/** The coming occurrence of a weekday; naming today's weekday means today. */
function weekdayKey(weekday: number, forceNextWeek = false): string {
  const today = startOfDay(new Date())
  let delta = (weekday - today.getDay() + 7) % 7
  if (forceNextWeek && delta === 0) delta = 7
  return toDateKey(addDays(today, delta))
}

/**
 * "next friday" means the friday of next week, not the coming one: the week is
 * read as Monday-to-Sunday, exactly like `nextWeekKey()`.
 */
function weekdayOfNextWeek(weekday: number): string {
  const today = startOfDay(new Date())
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7
  const monday = addDays(today, daysUntilMonday)
  return toDateKey(addDays(monday, weekday === 0 ? 6 : weekday - 1))
}

function matchProject(text: string, projects: Project[]): { project: Project; raw: string } | null {
  // Longest names first so "#Music Theory" wins over "#Music".
  const candidates = [...projects].sort((a, b) => b.name.length - a.name.length)

  for (const project of candidates) {
    // A word boundary only works when the name ends in a word character, so the
    // guard is "no word character follows" — that also covers names like "Math (2026)".
    const pattern = new RegExp(`#${escapeRegExp(project.name)}(?![\\w])`, "i")
    const match = pattern.exec(text)
    if (match) return { project, raw: match[0] }
  }

  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
