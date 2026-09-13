"use client"

import { useEffect } from "react"

import { useUiStore } from "@/stores/ui-store"

/**
 * Keyboard shortcuts that only apply while FocusFlow is focused (plan.md §17).
 *
 * The Ctrl+Alt+… combinations are registered globally in the main process,
 * because they are meant to work from any application. Ctrl+N, Ctrl+K and
 * Ctrl+Shift+F stay local on purpose — hijacking them system-wide would break
 * other apps, and the Settings screen documents them as "when FocusFlow is
 * focused".
 */
export function useAppShortcuts(): void {
  const openQuickAdd = useUiStore((state) => state.openQuickAdd)
  const quickAddOpen = useUiStore((state) => state.quickAddOpen)
  const taskDialogOpen = useUiStore((state) => state.taskDialog.open)
  const projectDialogOpen = useUiStore((state) => state.projectDialog.open)
  const toggleFocusMode = useUiStore((state) => state.toggleFocusMode)
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey
      if (!modifier || event.altKey) return

      const key = event.key.toLowerCase()

      if (key === "f" && event.shiftKey) {
        event.preventDefault()
        toggleFocusMode()
        return
      }

      if (key === "k" && !event.shiftKey) {
        event.preventDefault()
        toggleCommandPalette()
        return
      }

      if (key === "n" && !event.shiftKey) {
        // Never stack dialogs on top of each other.
        if (taskDialogOpen || projectDialogOpen || quickAddOpen) return
        event.preventDefault()
        openQuickAdd()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    openQuickAdd,
    quickAddOpen,
    taskDialogOpen,
    projectDialogOpen,
    toggleFocusMode,
    toggleCommandPalette,
  ])
}
