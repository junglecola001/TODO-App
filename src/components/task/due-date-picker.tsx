"use client"

import { CalendarDays, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDueDate, nextWeekKey, thisWeekendKey, todayKey, tomorrowKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

const PRESETS: Array<{ label: string; resolve: () => string }> = [
  { label: "Today", resolve: todayKey },
  { label: "Tomorrow", resolve: tomorrowKey },
  { label: "This weekend", resolve: thisWeekendKey },
  { label: "Next week", resolve: nextWeekKey },
]

const optionClass =
  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"

/** Presets first, a native date field for anything else. */
export function DueDatePicker({
  value,
  onChange,
  className,
}: {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("justify-start gap-1.5 font-normal", value && "text-foreground", className)}
        >
          <CalendarDays className="size-3.5" strokeWidth={1.9} />
          {value ? formatDueDate(value) : "Due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        <div className="flex flex-col">
          {PRESETS.map((preset) => {
            const key = preset.resolve()
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(key)}
                className={cn(optionClass, value === key && "text-primary")}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        <div className="my-1.5 h-px bg-border" />

        <div className="px-1 py-0.5">
          <input
            type="date"
            aria-label="Custom due date"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value || null)}
            className="h-7 w-full rounded-xs border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        {value ? (
          <>
            <div className="my-1.5 h-px bg-border" />
            <button type="button" onClick={() => onChange(null)} className={cn(optionClass, "text-muted-foreground")}>
              Clear
              <X className="size-3.5" />
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
