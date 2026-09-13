import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/**
 * A keyboard shortcut hint. Always rendered as real text so shortcuts stay
 * readable by screen readers and in the Settings list.
 */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded-xs border border-border bg-muted px-1.5 font-sans text-[11px] font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
