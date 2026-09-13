import { create } from "zustand"

interface TaskDialogState {
  open: boolean
  /** null means "create a new task". */
  taskId: string | null
  /** Pre-selected project, used when adding from a project view. */
  defaultProjectId: string | null
}

interface ProjectDialogState {
  open: boolean
  /** null means "create a new project". */
  projectId: string | null
}

interface UiState {
  quickAddOpen: boolean
  commandPaletteOpen: boolean
  taskDialog: TaskDialogState
  projectDialog: ProjectDialogState
  focusMode: boolean

  openQuickAdd: () => void
  closeQuickAdd: () => void

  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void

  openTaskDialog: (options?: { taskId?: string | null; projectId?: string | null }) => void
  closeTaskDialog: () => void

  openProjectDialog: (projectId?: string | null) => void
  closeProjectDialog: () => void

  enterFocusMode: () => void
  exitFocusMode: () => void
  toggleFocusMode: () => void
}

/**
 * Transient UI state that more than one place needs to drive: a keyboard
 * shortcut, a sidebar button and a command palette entry all end up opening
 * the same dialog, and only one of each may be open at a time.
 */
export const useUiStore = create<UiState>((set) => ({
  quickAddOpen: false,
  commandPaletteOpen: false,
  taskDialog: { open: false, taskId: null, defaultProjectId: null },
  projectDialog: { open: false, projectId: null },
  focusMode: false,

  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  openTaskDialog: (options) =>
    set({
      quickAddOpen: false,
      taskDialog: {
        open: true,
        taskId: options?.taskId ?? null,
        defaultProjectId: options?.projectId ?? null,
      },
    }),
  closeTaskDialog: () =>
    set({ taskDialog: { open: false, taskId: null, defaultProjectId: null } }),

  openProjectDialog: (projectId) => set({ projectDialog: { open: true, projectId: projectId ?? null } }),
  closeProjectDialog: () => set({ projectDialog: { open: false, projectId: null } }),

  enterFocusMode: () => set({ focusMode: true }),
  exitFocusMode: () => set({ focusMode: false }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
}))
