import { eq } from "drizzle-orm"

import { DEFAULT_SETTINGS } from "@/lib/constants"
import { mergeSettings, sanitizeSettings } from "@/lib/settings"
import type { AppSettings } from "@/types/settings"

import { getDb } from "../index"
import { settings } from "../schema"

/**
 * Settings are stored as one row per key so new options never need a migration.
 * Values are JSON-encoded and sanitized on the way in and out, which keeps a
 * corrupted row from breaking the UI.
 */

export function readSettings(): AppSettings {
  const rows = getDb().select().from(settings).all()
  const stored: Record<string, unknown> = {}

  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.value)
    } catch {
      console.warn(`[focusflow] ignoring unreadable setting "${row.key}"`)
    }
  }

  return mergeSettings(DEFAULT_SETTINGS, stored)
}

/** Applies a partial patch and returns the complete, sanitized settings. */
export function writeSettings(patch: unknown): AppSettings {
  const sanitized = sanitizeSettings(patch)
  const db = getDb()

  for (const [key, value] of Object.entries(sanitized)) {
    const encoded = JSON.stringify(value)
    db.insert(settings)
      .values({ key, value: encoded })
      .onConflictDoUpdate({ target: settings.key, set: { value: encoded } })
      .run()
  }

  return readSettings()
}

/**
 * Internal bookkeeping (the timer's own state, first-run flags) that is not
 * part of the user-facing settings, so it deliberately skips sanitization.
 */
export function readRawSetting(key: string): string | null {
  const row = getDb().select().from(settings).where(eq(settings.key, key)).get()
  return row?.value ?? null
}

export function writeRawSetting(key: string, value: string | null): void {
  const db = getDb()

  if (value === null) {
    db.delete(settings).where(eq(settings.key, key)).run()
    return
  }

  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run()
}
