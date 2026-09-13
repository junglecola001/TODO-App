import { randomUUID } from "node:crypto"

import { asc, desc, eq, gte } from "drizzle-orm"

import type { PomodoroSession, PomodoroType } from "@/types/domain"

import { getDb } from "../index"
import { pomodoroSessions } from "../schema"

export interface CreateSessionInput {
  taskId: string | null
  type: PomodoroType
  startedAt: number
  completedAt: number
  duration: number
}

/** Every finished phase is recorded, so Statistics can count focus and rest separately. */
export function createSession(input: CreateSessionInput): PomodoroSession {
  const session: PomodoroSession = {
    id: randomUUID(),
    taskId: input.taskId,
    type: input.type,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    duration: Math.max(0, Math.round(input.duration)),
  }

  getDb().insert(pomodoroSessions).values(session).run()
  return session
}

export function listSessionsSince(since: number): PomodoroSession[] {
  return getDb()
    .select()
    .from(pomodoroSessions)
    .where(gte(pomodoroSessions.startedAt, since))
    .orderBy(asc(pomodoroSessions.startedAt))
    .all()
}

export function listSessionsForTask(taskId: string): PomodoroSession[] {
  return getDb()
    .select()
    .from(pomodoroSessions)
    .where(eq(pomodoroSessions.taskId, taskId))
    .orderBy(desc(pomodoroSessions.startedAt))
    .all()
}
