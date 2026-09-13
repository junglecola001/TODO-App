import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Empty states are part of the design, never a bare "No data." */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 px-6 py-14 text-center",
        className
      )}
    >
      {Icon ? <Icon className="mb-1 size-5 text-muted-foreground/60" strokeWidth={1.5} /> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
