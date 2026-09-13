"use client"

import { useEffect, useState } from "react"

import { FocusFlowMark } from "@/components/brand/logo"
import { WindowControls } from "@/components/layout/window-controls"
import { APP_NAME, APP_TAGLINE } from "@/lib/constants"
import { getDesktopBridge } from "@/lib/ipc"
import type { AppInfo } from "@/types/ipc"

/**
 * Temporary landing screen for the foundation build: it proves the window,
 * the theme tokens and the IPC bridge are wired up. Replaced by the Today
 * view in the next phase.
 */
export default function RootPage() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [bridgeError, setBridgeError] = useState<string | null>(null)

  useEffect(() => {
    const bridge = getDesktopBridge()
    if (!bridge) {
      setBridgeError("Running outside Electron — window controls and local data are unavailable.")
      return
    }

    let active = true
    bridge.app
      .getInfo()
      .then((next) => {
        if (active) setInfo(next)
      })
      .catch((error: unknown) => {
        if (active) setBridgeError(error instanceof Error ? error.message : String(error))
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="flex h-screen flex-col">
      <header className="drag-region flex h-11 shrink-0 items-center justify-between pl-4">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">{APP_NAME}</span>
        <WindowControls className="pr-1.5" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
        <FocusFlowMark className="size-11" />
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>

        <p className="mt-8 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
          Foundation build — the project skeleton, design tokens and desktop shell are in place.
          Today, Inbox, Upcoming, Projects, Focus and Statistics land in the next phases.
        </p>

        {info ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">
            v{info.version} · Electron {info.versions.electron} · {info.platform}
          </p>
        ) : null}

        {bridgeError ? <p className="mt-2 max-w-md text-xs text-destructive">{bridgeError}</p> : null}
      </div>
    </main>
  )
}
