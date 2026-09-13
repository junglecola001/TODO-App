import { create } from "zustand"

import { DEFAULT_SETTINGS } from "@/lib/constants"
import { messageOf } from "@/lib/errors"
import { ipc } from "@/lib/ipc"
import type { AppSettings } from "@/types/settings"

import type { LoadStatus } from "@/stores/task-store"

interface SettingsState {
  /** Defaults until the stored values arrive, so the UI never renders blanks. */
  settings: AppSettings
  status: LoadStatus
  error: string | null

  load: () => Promise<void>
  update: (patch: Partial<AppSettings>) => Promise<void>
  clearError: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  status: "idle",
  error: null,

  load: async () => {
    set({ status: "loading", error: null })
    try {
      set({ settings: await ipc.settings.get(), status: "ready" })
    } catch (error) {
      set({ status: "error", error: messageOf(error) })
    }
  },

  update: async (patch) => {
    // Apply immediately, persist after — settings are cheap to roll back.
    set((state) => ({ settings: { ...state.settings, ...patch }, error: null }))

    try {
      set({ settings: await ipc.settings.update(patch) })
    } catch (error) {
      set({ error: messageOf(error) })
    }
  },

  clearError: () => set({ error: null }),
}))
