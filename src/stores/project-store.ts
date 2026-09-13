import { create } from "zustand"

import { messageOf } from "@/lib/errors"
import { ipc } from "@/lib/ipc"
import type { CreateProjectInput, Project, UpdateProjectInput } from "@/types/domain"

import type { LoadStatus } from "@/stores/task-store"

interface ProjectState {
  projects: Project[]
  /** Which project the Projects view is showing. Selection lives here because
   *  static export cannot pre-render a route per project id. */
  selectedProjectId: string | null
  status: LoadStatus
  error: string | null

  load: () => Promise<void>
  select: (id: string | null) => void
  create: (input: CreateProjectInput) => Promise<Project | null>
  update: (id: string, patch: UpdateProjectInput) => Promise<Project | null>
  remove: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  status: "idle",
  error: null,

  load: async () => {
    set({ status: "loading", error: null })
    try {
      const projects = await ipc.projects.list()
      set({
        projects,
        status: "ready",
        selectedProjectId: get().selectedProjectId ?? projects[0]?.id ?? null,
      })
    } catch (error) {
      set({ status: "error", error: messageOf(error) })
    }
  },

  select: (id) => set({ selectedProjectId: id }),

  create: async (input) => {
    try {
      const project = await ipc.projects.create(input)
      set({ projects: [...get().projects, project], selectedProjectId: project.id, error: null })
      return project
    } catch (error) {
      set({ error: messageOf(error) })
      return null
    }
  },

  update: async (id, patch) => {
    try {
      const project = await ipc.projects.update(id, patch)
      set({
        projects: get().projects.map((item) => (item.id === id ? project : item)),
        error: null,
      })
      return project
    } catch (error) {
      set({ error: messageOf(error) })
      return null
    }
  },

  remove: async (id) => {
    const previous = get().projects
    set({
      projects: previous.filter((project) => project.id !== id),
      selectedProjectId: get().selectedProjectId === id ? null : get().selectedProjectId,
      error: null,
    })

    try {
      await ipc.projects.remove(id)
      return true
    } catch (error) {
      set({ projects: previous, error: messageOf(error) })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))
