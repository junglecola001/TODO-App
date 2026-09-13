import { ipcMain } from "electron"

import { IPC } from "@/lib/ipc-channels"
import type { CreateTaskInput, UpdateTaskInput } from "@/types/domain"

import {
  createTask,
  deleteTask,
  incrementTaskPomodoros,
  listTasks,
  setTaskCompleted,
  updateTask,
} from "../db/repositories/task-repository"
import { databaseOperation } from "./errors"

export function registerTaskIpc(): void {
  ipcMain.handle(IPC.TasksList, () =>
    databaseOperation("Unable to load your tasks.", () => listTasks())
  )

  ipcMain.handle(IPC.TasksCreate, (_event, input: CreateTaskInput) =>
    databaseOperation("Unable to save the task.", () => createTask(input))
  )

  ipcMain.handle(IPC.TasksUpdate, (_event, id: string, patch: UpdateTaskInput) =>
    databaseOperation("Unable to save the task.", () => {
      const task = updateTask(id, patch)
      if (!task) throw new Error("That task no longer exists.")
      return task
    })
  )

  ipcMain.handle(IPC.TasksDelete, (_event, id: string) =>
    databaseOperation("Unable to delete the task.", () => {
      deleteTask(id)
    })
  )

  ipcMain.handle(IPC.TasksSetCompleted, (_event, id: string, completed: boolean) =>
    databaseOperation("Unable to update the task.", () => {
      const task = setTaskCompleted(id, completed)
      if (!task) throw new Error("That task no longer exists.")
      return task
    })
  )
}

/**
 * Not exposed to the renderer: the focus timer runs in the main process, so it
 * updates its task's pomodoro count directly.
 */
export function recordPomodoroForTask(taskId: string): void {
  databaseOperation("Unable to update the task's pomodoro count.", () => {
    incrementTaskPomodoros(taskId)
  })
}
