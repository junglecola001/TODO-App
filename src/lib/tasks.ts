import { PRIORITY_WEIGHT } from "@/lib/constants"
import { daysUntil, todayKey } from "@/lib/dates"
import type { Task } from "@/types/domain"

/**
 * View definitions for the task lists. A task belongs to exactly one of
 * Today / Inbox / Upcoming:
 *
 * - Today     due today or overdue
 * - Inbox     no due date yet
 * - Upcoming  due tomorrow or later
 */
export function selectTodayTasks(tasks: Task[]): Task[] {
  return sortTasks(
    tasks.filter((task) => !task.completed && task.dueDate !== null && daysUntil(task.dueDate) <= 0)
  )
}

export function selectInboxTasks(tasks: Task[]): Task[] {
  return sortTasks(tasks.filter((task) => !task.completed && task.dueDate === null))
}

export function selectUpcomingTasks(tasks: Task[]): Task[] {
  return sortTasks(
    tasks.filter((task) => !task.completed && task.dueDate !== null && daysUntil(task.dueDate) > 0)
  )
}

/** Finished today — shown at the end of Today so progress stays visible. */
export function selectCompletedToday(tasks: Task[]): Task[] {
  const today = todayKey()
  return tasks
    .filter(
      (task) =>
        task.completed && task.completedAt !== null && todayKeyOf(task.completedAt) === today
    )
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
}

export function selectProjectTasks(tasks: Task[], projectId: string): Task[] {
  return sortTasks(tasks.filter((task) => task.projectId === projectId && !task.completed))
}

/** Overdue first, then priority, then newest. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dueDate = (a.dueDate ?? "").localeCompare(b.dueDate ?? "")
    if (dueDate !== 0) return dueDate

    const priority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    if (priority !== 0) return priority

    return b.createdAt - a.createdAt
  })
}

export interface DueDateGroup {
  key: string
  tasks: Task[]
}

/** Upcoming is grouped by day, in chronological order. */
export function groupByDueDate(tasks: Task[]): DueDateGroup[] {
  const groups = new Map<string, Task[]>()

  for (const task of sortTasks(tasks)) {
    if (!task.dueDate) continue
    const bucket = groups.get(task.dueDate)
    if (bucket) bucket.push(task)
    else groups.set(task.dueDate, [task])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupTasks]) => ({ key, tasks: groupTasks }))
}

export function countCompletedToday(tasks: Task[]): number {
  return selectCompletedToday(tasks).length
}

export function isTaskOverdue(task: Task): boolean {
  return !task.completed && task.dueDate !== null && daysUntil(task.dueDate) < 0
}

function todayKeyOf(timestamp: number): string {
  const date = new Date(timestamp)
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
