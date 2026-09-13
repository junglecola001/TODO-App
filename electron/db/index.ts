import fs from "node:fs"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { databasePath, userDataDir } from "../lib/paths"
import { runMigrations } from "./migrate"
import * as schema from "./schema"

export type SqliteConnection = Database.Database

function createDatabase() {
  fs.mkdirSync(userDataDir(), { recursive: true })

  const sqlite = new Database(databasePath())
  // WAL keeps writes fast and safe without a long-lived lock; NORMAL is the
  // documented pairing for it.
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("synchronous = NORMAL")
  sqlite.pragma("foreign_keys = ON")

  runMigrations(sqlite)

  return { sqlite, db: drizzle(sqlite, { schema }) }
}

export type FocusFlowDatabase = ReturnType<typeof createDatabase>["db"]

let connection: ReturnType<typeof createDatabase> | null = null

/** Opens %APPDATA%/FocusFlow/focusflow.db, creating and migrating it on first run. */
export function initDatabase(): void {
  if (!connection) {
    connection = createDatabase()
    console.log(`[focusflow] database ready at ${databasePath()}`)
  }
}

export function getDb(): FocusFlowDatabase {
  if (!connection) {
    throw new Error("The database has not been initialised yet.")
  }
  return connection.db
}

/**
 * The raw better-sqlite3 handle, for the few aggregate queries where a
 * hand-written prepared statement is clearer than the query builder.
 * Always bind parameters — never interpolate values into SQL.
 */
export function getSqlite(): SqliteConnection {
  if (!connection) {
    throw new Error("The database has not been initialised yet.")
  }
  return connection.sqlite
}

export function closeDatabase(): void {
  connection?.sqlite.close()
  connection = null
}
