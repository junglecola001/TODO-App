import type { Priority } from "@/lib/constants"
import type { AccentPresetId } from "@/types/settings"

export type { Priority }

export interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: Priority
  /** Local calendar date as `YYYY-MM-DD`; timezone-safe by design. */
  dueDate: string | null
  projectId: string | null
  estimatedPomodoros: number
  actualPomodoros: number
  /** Epoch milliseconds. */
  createdAt: number
  completedAt: number | null
}

export interface Project {
  id: string
  name: string
  /** Lucide icon name; resolved through the curated map in the renderer. */
  icon: string
  color: AccentPresetId
  createdAt: number
}

export type PomodoroType = "focus" | "short_break" | "long_break"

export interface PomodoroSession {
  id: string
  taskId: string | null
  type: PomodoroType
  startedAt: number
  completedAt: number
  /** Length of the session in milliseconds. */
  duration: number
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  priority?: Priority
  dueDate?: string | null
  projectId?: string | null
  estimatedPomodoros?: number
}

/** Completed state changes go through `setCompleted` so `completedAt` stays consistent. */
export interface UpdateTaskInput {
  title?: string
  description?: string | null
  priority?: Priority
  dueDate?: string | null
  projectId?: string | null
  estimatedPomodoros?: number
}

export interface CreateProjectInput {
  name: string
  icon?: string
  color?: AccentPresetId
}

export interface UpdateProjectInput {
  name?: string
  icon?: string
  color?: AccentPresetId
}
