import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { Priority } from "@/lib/constants"
import type { PomodoroType } from "@/types/domain"
import type { AccentPresetId } from "@/types/settings"

/**
 * Drizzle table definitions. `electron/db/migrate.ts` holds the matching SQL —
 * the two must be changed together.
 *
 * Conventions:
 * - ids are UUID strings generated in the main process
 * - timestamps are epoch milliseconds (`createdAt`, `startedAt`, …)
 * - `dueDate` is a local calendar date as `YYYY-MM-DD`, never a timestamp
 *
 * `$type<…>()` narrows text columns to the unions the domain uses, so rows can
 * be handed to the renderer without casting.
 */

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** Lucide icon name, resolved through a curated map in the renderer. */
  icon: text("icon").notNull().default("folder"),
  /** Accent preset id used for the project marker. */
  color: text("color").$type<AccentPresetId>().notNull().default("blue"),
  createdAt: integer("created_at").notNull(),
})

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    priority: text("priority").$type<Priority>().notNull().default("none"),
    dueDate: text("due_date"),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    estimatedPomodoros: integer("estimated_pomodoros").notNull().default(0),
    actualPomodoros: integer("actual_pomodoros").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (table) => [
    index("tasks_project_idx").on(table.projectId),
    index("tasks_due_date_idx").on(table.dueDate),
    index("tasks_completed_idx").on(table.completed),
  ]
)

export const pomodoroSessions = sqliteTable(
  "pomodoro_sessions",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    type: text("type").$type<PomodoroType>().notNull(),
    startedAt: integer("started_at").notNull(),
    completedAt: integer("completed_at").notNull(),
    /** Milliseconds actually spent focusing. */
    duration: integer("duration").notNull(),
  },
  (table) => [index("pomodoro_sessions_started_idx").on(table.startedAt)]
)

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  /** JSON-encoded value; see `src/lib/settings.ts` for the expected shape. */
  value: text("value").notNull(),
})
