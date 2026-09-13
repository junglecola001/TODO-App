/**
 * Turns anything thrown into a message that is safe to show a person.
 *
 * `ipcRenderer.invoke` rejects with a wrapper like
 * `Error invoking remote method 'tasks:create': Error: A task needs a title.`,
 * so the innermost message is what we surface.
 */
export function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) {
    const marker = error.message.lastIndexOf("Error: ")
    if (marker >= 0) {
      const inner = error.message.slice(marker + "Error: ".length).trim()
      if (inner) return inner
    }
    return error.message
  }

  return "Something went wrong."
}
