"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * FocusFlow opens on Today. Electron loads `/today/` directly, so this route
 * only matters when something navigates to the bare origin.
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/today")
  }, [router])

  return null
}
