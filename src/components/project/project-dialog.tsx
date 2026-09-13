"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PROJECT_ICON_NAMES, resolveProjectIcon } from "@/components/layout/project-icon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ACCENT_PRESETS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/stores/project-store"
import { useTaskStore } from "@/stores/task-store"
import { useUiStore } from "@/stores/ui-store"
import type { AccentPresetId } from "@/types/settings"

/** Create, rename, restyle or delete a project. */
export function ProjectDialog() {
  const { open, projectId } = useUiStore((state) => state.projectDialog)
  const close = useUiStore((state) => state.closeProjectDialog)

  const projects = useProjectStore((state) => state.projects)
  const createProject = useProjectStore((state) => state.create)
  const updateProject = useProjectStore((state) => state.update)
  const removeProject = useProjectStore((state) => state.remove)
  const loadTasks = useTaskStore((state) => state.load)

  const project = projectId ? (projects.find((item) => item.id === projectId) ?? null) : null

  const [name, setName] = useState("")
  const [icon, setIcon] = useState<string>("folder")
  const [color, setColor] = useState<AccentPresetId>("blue")
  const [saving, setSaving] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(project?.name ?? "")
    setIcon(project?.icon ?? "folder")
    setColor(project?.color ?? "blue")
    setSaving(false)
    setConfirmDeleteOpen(false)
  }, [open, project])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName || saving) return

    setSaving(true)
    const saved = project
      ? await updateProject(project.id, { name: trimmedName, icon, color })
      : await createProject({ name: trimmedName, icon, color })
    setSaving(false)

    if (!saved) {
      toast.error(useProjectStore.getState().error ?? "Unable to save the project.")
      return
    }

    close()
  }

  const handleDelete = async () => {
    if (!project) return

    const removed = await removeProject(project.id)
    if (!removed) {
      toast.error(useProjectStore.getState().error ?? "Unable to delete the project.")
      return
    }

    // The database has set those tasks' project to NULL, so refresh the list
    // instead of leaving stale project badges behind.
    await loadTasks()
    close()
  }

  const SelectedIcon = resolveProjectIcon(icon)

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription className="sr-only">
              Name, icon and accent color for this project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border"
                style={{ color: ACCENT_PRESETS.find((preset) => preset.id === color)?.hex }}
              >
                <SelectedIcon className="size-4" />
              </span>
              <div className="flex-1">
                <Label htmlFor="project-name" className="sr-only">
                  Project name
                </Label>
                <Input
                  id="project-name"
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Project name"
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Icon
              </p>
              <div className="grid grid-cols-9 gap-1">
                {PROJECT_ICON_NAMES.map((iconName) => {
                  const Icon = resolveProjectIcon(iconName)
                  const isActive = iconName === icon
                  return (
                    <button
                      key={iconName}
                      type="button"
                      aria-label={iconName}
                      aria-pressed={isActive}
                      onClick={() => setIcon(iconName)}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                        "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        isActive && "bg-accent text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Color
              </p>
              <div className="flex items-center gap-2">
                {ACCENT_PRESETS.map((preset) => {
                  const isActive = preset.id === color
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-label={preset.label}
                      aria-pressed={isActive}
                      title={preset.label}
                      onClick={() => setColor(preset.id)}
                      style={{ backgroundColor: preset.hex }}
                      className={cn(
                        "size-6 rounded-full border border-black/10 transition-transform hover:scale-105",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isActive && "ring-2 ring-ring/60 ring-offset-2 ring-offset-background"
                      )}
                    />
                  )
                })}
              </div>
            </div>

            <DialogFooter className="items-center gap-2 sm:justify-between">
              {project ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || saving}>
                  {project ? "Save changes" : "Create project"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              Its tasks are kept and move to the Inbox. Focus history stays in your statistics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
