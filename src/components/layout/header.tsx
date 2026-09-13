"use client"

import Link from "next/link"
import { Search, Settings } from "lucide-react"

import { FocusFlowWordmark } from "@/components/brand/logo"
import { WindowControls } from "@/components/layout/window-controls"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useUiStore } from "@/stores/ui-store"

/**
 * The window's title bar: draggable, with the wordmark on the left and the
 * window controls on the right. Everything interactive opts out of dragging.
 */
export function Header() {
  const openCommandPalette = useUiStore((store) => store.openCommandPalette)

  return (
    <header className="drag-region flex h-11 shrink-0 items-center justify-between border-b border-border/60 pl-4">
      <FocusFlowWordmark className="text-foreground/80" />

      <div className="flex items-center gap-0.5 pr-1.5">
        <button
          type="button"
          aria-label="Search commands and tasks"
          onClick={openCommandPalette}
          className="no-drag inline-flex h-8 items-center gap-2 rounded-md px-2 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Search className="size-3.5" strokeWidth={1.9} />
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <Button asChild variant="ghost" size="icon-sm" className="no-drag text-muted-foreground">
          <Link href="/settings" aria-label="Settings">
            <Settings className="size-4" strokeWidth={1.9} />
          </Link>
        </Button>

        <WindowControls />
      </div>
    </header>
  )
}
