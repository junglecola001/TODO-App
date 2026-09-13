import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-soft", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="tabular text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
