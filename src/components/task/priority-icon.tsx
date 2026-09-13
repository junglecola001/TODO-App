import { Flag } from "lucide-react"

import type { Priority } from "@/lib/constants"
import { cn } from "@/lib/utils"

/**
 * Priority is communicated with one small flag, not a colored card.
 * `none` renders nothing so the calm default stays calm.
 */
const PRIORITY_STYLES: Record<Priority, string | null> = {
  none: null,
  low: "text-sky-500/80",
  medium: "text-amber-500/90",
  high: "text-red-500/90",
}

export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority
  className?: string
}) {
  const style = PRIORITY_STYLES[priority]
  if (!style) return null

  return (
    <Flag
      className={cn("size-3 shrink-0", style, className)}
      strokeWidth={2.2}
      aria-hidden
    />
  )
}
