import { randomUUID } from "node:crypto"

import { desc, eq, sql } from "drizzle-orm"

import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types/domain"

import { getDb } from "../index"
import { tasks } from "../schema"

/**
 * Task data access. Every method returns plain domain objects; nothing outside
 * this layer knows about SQL or Drizzle.
 *
 * All lists come back newest first — view-specific ordering (priority, due
 * date, project) is applied in the renderer, where the data volume is tiny.
 */

export function listTasks(): Task[] {
  return getDb().select().from(tasks).orderBy(desc(tasks.createdAt)).all()
}

export function getTask(id: string): Task | null {
  return getDb().select().from(tasks).where(eq(tasks.id, id)).get() ?? null
}

export function createTask(input: CreateTaskInput): Task {
  const title = input.title?.trim()
  if (!title) throw new Error("A task needs a title.")

  const task: Task = {
    id: randomUUID(),
    title,
    description: input.description?.trim() || null,
    completed: false,
    priority: input.priority ?? "none",
    dueDate: input.dueDate ?? null,
    projectId: input.projectId ?? null,
    estimatedPomodoros: Math.max(0, Math.round(input.estimatedPomodoros ?? 0)),
    actualPomodoros: 0,
    createdAt: Date.now(),
    completedAt: null,
  }

  getDb().insert(tasks).values(task).run()
  return task
}

export function updateTask(id: string, patch: UpdateTaskInput): Task | null {
  const changes: Partial<Task> = {}

  if (patch.title !== undefined) {
    const title = patch.title.trim()
    if (!title) throw new Error("A task needs a title.")
    changes.title = title
  }
  if (patch.description !== undefined) changes.description = patch.description?.trim() || null
  if (patch.priority !== undefined) changes.priority = patch.priority
  if (patch.dueDate !== undefined) changes.dueDate = patch.dueDate
  if (patch.projectId !== undefined) changes.projectId = patch.projectId
  if (patch.estimatedPomodoros !== undefined) {
    changes.estimatedPomodoros = Math.max(0, Math.round(patch.estimatedPomodoros))
  }

  if (Object.keys(changes).length > 0) {
    getDb().update(tasks).set(changes).where(eq(tasks.id, id)).run()
  }

  return getTask(id)
}

/** Completion always moves through here so `completedAt` cannot drift. */
export function setTaskCompleted(id: string, completed: boolean): Task | null {
  getDb()
    .update(tasks)
    .set({ completed, completedAt: completed ? Date.now() : null })
    .where(eq(tasks.id, id))
    .run()

  return getTask(id)
}

export function deleteTask(id: string): void {
  getDb().delete(tasks).where(eq(tasks.id, id)).run()
}

/** Called by the focus timer when a pomodoro session finishes. */
export function incrementTaskPomodoros(id: string): void {
  getDb()
    .update(tasks)
    .set({ actualPomodoros: sql`${tasks.actualPomodoros} + 1` })
    .where(eq(tasks.id, id))
    .run()
}
