"use client"

import { format } from "date-fns"

import { formatDuration, parseDateKey } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { DailyStat } from "@/types/statistics"

/**
 * A deliberately plain weekly chart (plan.md §13): one bar per day, no
 * dashboard machinery. The values are also written out for screen readers.
 */
export function WeeklyChart({ daily, className }: { daily: DailyStat[]; className?: string }) {
  const peak = Math.max(...daily.map((day) => day.focusSessions), 1)

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <figcaption className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Pomodoros per day
      </figcaption>

      <div className="flex items-end gap-2">
        {daily.map((day) => {
          const height = (day.focusSessions / peak) * 100
          const isToday = day.date === daily[daily.length - 1]?.date

          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] tabular text-muted-foreground">
                {day.focusSessions > 0 ? day.focusSessions : ""}
              </span>
              <div
                className="flex h-24 w-full items-end overflow-hidden rounded-md bg-muted/60"
                title={`${format(parseDateKey(day.date), "EEEE")}: ${day.focusSessions} pomodoros · ${formatDuration(day.focusMs)}`}
              >
                <div
                  className={cn(
                    "w-full rounded-md transition-[height] duration-300 ease-calm",
                    isToday ? "bg-primary" : "bg-primary/45"
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  isToday ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {format(parseDateKey(day.date), "EEE")}
              </span>
            </div>
          )
        })}
      </div>

      <ul className="sr-only">
        {daily.map((day) => (
          <li key={day.date}>
            {format(parseDateKey(day.date), "EEEE")}: {day.focusSessions} pomodoros,{" "}
            {formatDuration(day.focusMs)} of focus, {day.completedTasks} tasks completed
          </li>
        ))}
      </ul>
    </figure>
  )
}
