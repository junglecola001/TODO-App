"use client"

import { useEffect, useState } from "react"

/**
 * "Good morning." / "Good afternoon." / "Good evening."
 *
 * Resolved after mount so the statically exported HTML never bakes in the
 * build machine's clock.
 */
export function useGreeting(): string {
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const update = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting("Good morning.")
      else if (hour < 18) setGreeting("Good afternoon.")
      else setGreeting("Good evening.")
    }

    update()

    // Keep it honest when the app stays open across a boundary.
    const timer = window.setInterval(update, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return greeting
}
