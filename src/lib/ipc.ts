import type { FocusFlowApi } from "@/types/ipc"

const BRIDGE_UNAVAILABLE =
  "FocusFlow's desktop bridge is unavailable. Launch the app through Electron (`npm run dev`), not the Next.js dev server on its own."

/**
 * The desktop bridge, or `null` when the renderer is running outside Electron.
 * Use this for UI that should degrade quietly instead of throwing.
 */
export function getDesktopBridge(): FocusFlowApi | null {
  if (typeof window === "undefined") return null
  return window.focusflow ?? null
}

export function isDesktopBridgeAvailable(): boolean {
  return getDesktopBridge() !== null
}

function requireBridge(): FocusFlowApi {
  const bridge = getDesktopBridge()
  if (!bridge) throw new Error(BRIDGE_UNAVAILABLE)
  return bridge
}

/**
 * Typed access to the main process. Every call crosses the context bridge —
 * the renderer never touches Node.js, the filesystem or SQLite directly.
 */
export const ipc: FocusFlowApi = {
  get app() {
    return requireBridge().app
  },
  get window() {
    return requireBridge().window
  },
  get tasks() {
    return requireBridge().tasks
  },
  get projects() {
    return requireBridge().projects
  },
  get settings() {
    return requireBridge().settings
  },
  get timer() {
    return requireBridge().timer
  },
  get system() {
    return requireBridge().system
  },
  get statistics() {
    return requireBridge().statistics
  },
}
