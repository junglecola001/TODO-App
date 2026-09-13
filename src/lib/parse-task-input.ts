import { addDays } from "date-fns"

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

const DATE_PREFIXES = "on|by|due|this|next"

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

/**
 * Parses the small, predictable slice of natural language the quick add field
 * understands:
 *
 *   "Finish homework tomorrow"        -> dueDate = tomorrow
 *   "Practice piano !high"            -> priority = high
 *   "Read chapter 3 #School ~2"       -> project + 2 estimated pomodoros
 *   "Essay next friday"               -> dueDate = the friday of next week
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

  const pomodoroMatch = text.match(/\s~(\d{1,2})\s/)
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
  const simple: Array<{ pattern: RegExp; key: () => string }> = [
    { pattern: /\s(today|tonight)\s/i, key: todayKey },
    { pattern: /\stomorrow\s/i, key: tomorrowKey },
    { pattern: /\s(?:this\s+)?weekend\s/i, key: thisWeekendKey },
    { pattern: /\snext\s+week\s/i, key: nextWeekKey },
  ]

  for (const candidate of simple) {
    const match = text.match(candidate.pattern)
    if (match) return { raw: match[0], key: candidate.key() }
  }

  const full = Object.keys(FULL_WEEKDAYS).join("|")
  const short = Object.keys(SHORT_WEEKDAYS).join("|")

  const nextWeekday = text.match(new RegExp(`\\snext\\s+(${full}|${short})\\b`, "i"))
  if (nextWeekday) {
    const name = nextWeekday[1]!.toLowerCase()
    const weekday = FULL_WEEKDAYS[name] ?? SHORT_WEEKDAYS[name]!
    return { raw: nextWeekday[0], key: weekdayKey(weekday, true) }
  }

  const prefixedWeekday = text.match(new RegExp(`\\s(?:${DATE_PREFIXES})\\s+(${full}|${short})\\b`, "i"))
  if (prefixedWeekday) {
    const name = prefixedWeekday[1]!.toLowerCase()
    const weekday = FULL_WEEKDAYS[name] ?? SHORT_WEEKDAYS[name]!
    return { raw: prefixedWeekday[0], key: weekdayKey(weekday, false) }
  }

  const bareWeekday = text.match(new RegExp(`\\s(${full})\\b`, "i"))
  if (bareWeekday) {
    const weekday = FULL_WEEKDAYS[bareWeekday[1]!.toLowerCase()]!
    return { raw: bareWeekday[0], key: weekdayKey(weekday, false) }
  }

  const inDays = text.match(/\sin\s+(\d{1,2})\s+days?\b/i)
  if (inDays) {
    return { raw: inDays[0], key: toDateKey(addDays(new Date(), Number(inDays[1]))) }
  }

  return null
}

function weekdayKey(weekday: number, forceNextWeek: boolean): string {
  const today = new Date()
  let delta = (weekday - today.getDay() + 7) % 7
  if (forceNextWeek && delta === 0) delta = 7
  return toDateKey(addDays(today, delta))
}

function matchProject(text: string, projects: Project[]): { project: Project; raw: string } | null {
  // Longest names first so "#Music Theory" wins over "#Music".
  const candidates = [...projects].sort((a, b) => b.name.length - a.name.length)

  for (const project of candidates) {
    const pattern = new RegExp(`#${escapeRegExp(project.name)}\\b`, "i")
    const match = pattern.exec(text)
    if (match) return { project, raw: match[0] }
  }

  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
