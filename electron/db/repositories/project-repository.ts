import { randomUUID } from "node:crypto"

import { asc, eq } from "drizzle-orm"

import type { CreateProjectInput, Project, UpdateProjectInput } from "@/types/domain"

import { getDb } from "../index"
import { projects, settings } from "../schema"

/** The three starter projects, only created on an empty database. */
const STARTER_PROJECTS: readonly CreateProjectInput[] = [
  { name: "School", icon: "graduation-cap", color: "blue" },
  { name: "Music", icon: "music", color: "purple" },
  { name: "Personal", icon: "user", color: "green" },
]

export function listProjects(): Project[] {
  return getDb().select().from(projects).orderBy(asc(projects.createdAt)).all()
}

export function createProject(input: CreateProjectInput): Project {
  const name = input.name?.trim()
  if (!name) throw new Error("A project needs a name.")

  const project: Project = {
    id: randomUUID(),
    name,
    icon: input.icon?.trim() || "folder",
    color: input.color ?? "blue",
    createdAt: Date.now(),
  }

  getDb().insert(projects).values(project).run()
  return project
}

export function updateProject(id: string, patch: UpdateProjectInput): Project | null {
  const changes: Partial<Project> = {}

  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) throw new Error("A project needs a name.")
    changes.name = name
  }
  if (patch.icon !== undefined) changes.icon = patch.icon.trim() || "folder"
  if (patch.color !== undefined) changes.color = patch.color

  if (Object.keys(changes).length > 0) {
    getDb().update(projects).set(changes).where(eq(projects.id, id)).run()
  }

  return getProject(id)
}

export function getProject(id: string): Project | null {
  return getDb().select().from(projects).where(eq(projects.id, id)).get() ?? null
}

/** Tasks keep living: their `project_id` is set to NULL by the foreign key. */
export function deleteProject(id: string): void {
  getDb().delete(projects).where(eq(projects.id, id)).run()
}

/**
 * Seeds School / Music / Personal exactly once — the first time the app runs.
 * A flag in the settings table is used instead of "is the table empty?" so
 * deleting every project on purpose does not bring them back.
 */
const SEED_FLAG = "starter_projects_seeded"

export function ensureStarterProjects(): void {
  const db = getDb()

  const flag = db.select().from(settings).where(eq(settings.key, SEED_FLAG)).get()
  if (flag) return

  for (const project of STARTER_PROJECTS) {
    createProject(project)
  }

  db.insert(settings)
    .values({ key: SEED_FLAG, value: JSON.stringify(true) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(true) } })
    .run()
}
