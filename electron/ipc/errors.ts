/**
 * Runs a database operation and converts any failure into a message a person
 * can act on. The technical detail stays in the main-process console.
 *
 * See the error-state rules in plan.md §30: users see "Unable to save task.",
 * never `SQLITE_BUSY`.
 */
export function databaseOperation<T>(message: string, operation: () => T): T {
  try {
    return operation()
  } catch (error) {
    // Errors we raise ourselves already read well ("A task needs a title.").
    if (error instanceof Error && error.message !== "" && !isDriverError(error)) {
      console.error(`[focusflow] ${message}`, error)
      throw error
    }

    console.error(`[focusflow] ${message}`, error)
    throw new Error(message)
  }
}

/** better-sqlite3 surfaces low-level failures as `SqliteError`. */
function isDriverError(error: Error): boolean {
  return error.name === "SqliteError" || error.name === "TypeError"
}
