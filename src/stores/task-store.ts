import { create } from "zustand"

import { messageOf } from "@/lib/errors"
import { ipc } from "@/lib/ipc"
import { playSound } from "@/lib/sounds"
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types/domain"

export type LoadStatus = "idle" | "loading" | "ready" | "error"

interface TaskState {
  tasks: Task[]
  status: LoadStatus
  error: string | null

  load: () => Promise<void>
  create: (input: CreateTaskInput) => Promise<Task | null>
  update: (id: string, patch: UpdateTaskInput) => Promise<Task | null>
  remove: (id: string) => Promise<boolean>
  setCompleted: (id: string, completed: boolean) => Promise<void>
  clearError: () => void
}

/**
 * The renderer's single source of task state. Components never call the
 * database: they read this store and call its actions, which go through the
 * typed IPC bridge.
 */
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  status: "idle",
  error: null,

  load: async () => {
    set({ status: "loading", error: null })
    try {
      set({ tasks: await ipc.tasks.list(), status: "ready" })
    } catch (error) {
      set({ status: "error", error: messageOf(error) })
    }
  },

  create: async (input) => {
    try {
      const task = await ipc.tasks.create(input)
      set({ tasks: [task, ...get().tasks], error: null })
      return task
    } catch (error) {
      set({ error: messageOf(error) })
      return null
    }
  },

  update: async (id, patch) => {
    try {
      const task = await ipc.tasks.update(id, patch)
      set({
        tasks: get().tasks.map((item) => (item.id === id ? task : item)),
        error: null,
      })
      return task
    } catch (error) {
      set({ error: messageOf(error) })
      return null
    }
  },

  remove: async (id) => {
    const previous = get().tasks
    // Optimistic: deleting from a list should feel instant.
    set({ tasks: previous.filter((task) => task.id !== id), error: null })

    try {
      await ipc.tasks.remove(id)
      return true
    } catch (error) {
      set({ tasks: previous, error: messageOf(error) })
      return false
    }
  },

  setCompleted: async (id, completed) => {
    const previous = get().tasks
    // Optimistic so the checkbox animation never waits on disk I/O.
    set({
      tasks: previous.map((task) =>
        task.id === id
          ? { ...task, completed, completedAt: completed ? Date.now() : null }
          : task
      ),
      error: null,
    })

    if (completed) playSound("taskComplete")

    try {
      const task = await ipc.tasks.setCompleted(id, completed)
      set({ tasks: get().tasks.map((item) => (item.id === id ? task : item)) })
    } catch (error) {
      set({ tasks: previous, error: messageOf(error) })
    }
  },

  clearError: () => set({ error: null }),
}))
