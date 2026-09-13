import type { FocusFlowApi } from "./ipc"

declare global {
  interface Window {
    /** Injected by `electron/preload.ts`. Undefined when the renderer runs in a plain browser. */
    focusflow?: FocusFlowApi
  }
}

export {}
