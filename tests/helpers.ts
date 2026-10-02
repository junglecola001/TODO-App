import type { Task } from "@/types/domain"

/** A task with sensible defaults, so each test only states what it cares about. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Task",
    description: null,
    completed: false,
    priority: "none",
    dueDate: null,
    projectId: null,
    estimatedPomodoros: 0,
    actualPomodoros: 0,
    createdAt: 0,
    completedAt: null,
    ...overrides,
  }
}
