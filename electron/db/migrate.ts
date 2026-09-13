import type Database from "better-sqlite3"

/**
 * Schema migrations, applied in order and tracked with SQLite's `user_version`.
 *
 * These are written by hand rather than generated so the project needs no
 * drizzle-kit step at build time. Append a new entry — never edit an old one —
 * when the schema changes, and update `schema.ts` to match.
 */
const MIGRATIONS: readonly string[] = [
  /* v1 — initial schema */
  `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'folder',
    color TEXT NOT NULL DEFAULT 'blue',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'none',
    due_date TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    estimated_pomodoros INTEGER NOT NULL DEFAULT 0,
    actual_pomodoros INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks (project_id);
  CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);
  CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks (completed);

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER NOT NULL,
    duration INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS pomodoro_sessions_started_idx ON pomodoro_sessions (started_at);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
]

export function runMigrations(sqlite: Database.Database): void {
  const current = Number(sqlite.pragma("user_version", { simple: true }))

  for (let version = current; version < MIGRATIONS.length; version += 1) {
    sqlite.exec(MIGRATIONS[version]!)
    sqlite.pragma(`user_version = ${version + 1}`)
    console.log(`[focusflow] applied database migration v${version + 1}`)
  }
}
