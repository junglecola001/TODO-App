"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  count?: number
  /** Optional accent color for project entries. */
  color?: string
}

/**
 * A sidebar row. Below `lg` the sidebar narrows and labels are hidden, leaving
 * the icon (which keeps its accessible name through the label in the DOM).
 */
export function NavItem({ href, label, icon: Icon, active, count, color }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "max-lg:justify-center max-lg:px-0",
        active
          ? "bg-sidebar-accent text-foreground shadow-soft"
          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          !color && (active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")
        )}
        style={color ? { color } : undefined}
        strokeWidth={active ? 2.2 : 1.9}
      />
      <span className="truncate max-lg:hidden">{label}</span>
      {typeof count === "number" && count > 0 ? (
        <span className="ml-auto shrink-0 text-[11px] tabular text-muted-foreground max-lg:hidden">
          {count}
        </span>
      ) : null}
    </Link>
  )
}
