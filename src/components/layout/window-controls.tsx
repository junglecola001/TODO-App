"use client"

import { useEffect, useState } from "react"
import { Minus, Square, Copy, X } from "lucide-react"

import { getDesktopBridge } from "@/lib/ipc"
import { cn } from "@/lib/utils"

const controlClass =
  "no-drag inline-flex h-8 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"

/**
 * Minimize / maximize / close for the frameless window.
 * Renders nothing outside Electron, so browser previews stay clean.
 */
export function WindowControls({ className }: { className?: string }) {
  const [bridge] = useState(() => getDesktopBridge())
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!bridge) return

    let active = true
    bridge.window
      .isMaximized()
      .then((maximized) => {
        if (active) setIsMaximized(maximized)
      })
      .catch(() => undefined)

    const unsubscribe = bridge.window.onMaximizedChange(setIsMaximized)

    return () => {
      active = false
      unsubscribe()
    }
  }, [bridge])

  if (!bridge) return null

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button
        type="button"
        aria-label="Minimize"
        className={controlClass}
        onClick={() => bridge.window.minimize()}
      >
        <Minus className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={isMaximized ? "Restore" : "Maximize"}
        className={controlClass}
        onClick={() => bridge.window.toggleMaximize()}
      >
        {isMaximized ? <Copy className="size-3.5 -scale-x-100" /> : <Square className="size-3" />}
      </button>
      <button
        type="button"
        aria-label="Close"
        className={cn(controlClass, "hover:bg-destructive hover:text-destructive-foreground")}
        onClick={() => bridge.window.close()}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
