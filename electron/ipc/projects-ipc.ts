import { ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { CreateProjectInput, UpdateProjectInput } from "@/types/domain"

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../db/repositories/project-repository"
import { databaseOperation } from "./errors"

export function registerProjectIpc(): void {
  ipcMain.handle(IPC.ProjectsList, () =>
    databaseOperation("Unable to load your projects.", () => listProjects())
  )

  ipcMain.handle(IPC.ProjectsCreate, (_event, input: CreateProjectInput) =>
    databaseOperation("Unable to save the project.", () => createProject(input))
  )

  ipcMain.handle(IPC.ProjectsUpdate, (_event, id: string, patch: UpdateProjectInput) =>
    databaseOperation("Unable to save the project.", () => {
      const project = updateProject(id, patch)
      if (!project) throw new Error("That project no longer exists.")
      return project
    })
  )

  ipcMain.handle(IPC.ProjectsDelete, (_event, id: string) =>
    databaseOperation("Unable to delete the project.", () => {
      deleteProject(id)
    })
  )
}
