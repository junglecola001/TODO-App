"use client"

import { useEffect, useState } from "react"

/**
 * True once the component has mounted on the client.
 * Use it to render values that only exist in the browser (theme, current time)
 * without tripping hydration mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
