import { cn } from "@/lib/utils"

/**
 * The FocusFlow mark: a focus ring with a session gap, sitting on the accent color.
 * Mirrors the icon generated for the window, tray and installer.
 */
export function FocusFlowMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="FocusFlow"
      className={cn("size-6 text-primary", className)}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <circle
        cx="16"
        cy="16"
        r="7"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="34.4 9.6"
        transform="rotate(-90 16 16)"
      />
    </svg>
  )
}

export function FocusFlowWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <FocusFlowMark className="size-5" />
      <span className="text-[13px] font-semibold tracking-tight">FocusFlow</span>
    </span>
  )
}
