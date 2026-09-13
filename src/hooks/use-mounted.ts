"use client"

import { useSyncExternalStore } from "react"

/** Nothing to subscribe to: the snapshot only ever changes once, at hydration. */
const subscribe = () => () => undefined

/**
 * True once the component has mounted on the client.
 * Use it to render values that only exist in the browser (theme, current time)
 * without tripping hydration mismatches.
 */
export function useMounted(): boolean {
  // The supported way to ask "are we on the client yet": the server snapshot is
  // false so hydration matches, then the client snapshot flips to true.
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
