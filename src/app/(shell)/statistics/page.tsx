"use client"

import { useCallback, useEffect, useState } from "react"
import { Flame, TimerReset } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/statistics/stat-card"
import { WeeklyChart } from "@/components/statistics/weekly-chart"
import { accentPreset } from "@/lib/constants"
import { formatDuration, formatFullDate } from "@/lib/dates"
import { messageOf } from "@/lib/errors"
import { getDesktopBridge, ipc } from "@/lib/ipc"
import type { StatisticsSummary } from "@/types/statistics"

const RANGE_DAYS = 7

export default function StatisticsPage() {
  const [summary, setSummary] = useState<StatisticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setSummary(await ipc.statistics.get(RANGE_DAYS))
      setError(null)
    } catch (caught) {
      setError(messageOf(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // The setState calls inside `load` all sit behind an `await`, so nothing
    // runs synchronously in the effect body — the rule just cannot see across
    // the async boundary. Loading once on mount is the intent here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // A finished session changes every number on this page.
  useEffect(() => {
    const bridge = getDesktopBridge()
    if (!bridge) return

    return bridge.timer.onCompleted(() => {
      void load()
    })
  }, [load])

  const hasSessions = (summary?.focusSessions ?? 0) > 0

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-8 py-10">
      <PageHeader
        title="Statistics"
        description={`Last ${RANGE_DAYS} days`}
        actions={
          summary && summary.streakDays > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
              <Flame className="size-3.5 text-amber-500" strokeWidth={2} />
              {summary.streakDays} day{summary.streakDays === 1 ? "" : "s"} in a row
            </span>
          ) : undefined
        }
      />

      {loading ? null : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : summary && hasSessions ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Pomodoros"
              value={`${summary.focusSessions}`}
              hint={`in the last ${RANGE_DAYS} days`}
            />
            <StatCard label="Focus time" value={formatDuration(summary.focusMs)} />
            <StatCard label="Completed tasks" value={`${summary.completedTasks}`} />
            <StatCard label="Tasks created" value={`${summary.createdTasks}`} />
            <StatCard
              label="Average focus"
              value={summary.averageFocusMs > 0 ? formatDuration(summary.averageFocusMs) : "—"}
              hint="per session"
            />
            <StatCard
              label="Best streak"
              value={`${summary.longestStreakDays} ${summary.longestStreakDays === 1 ? "day" : "days"}`}
              hint={`in the last ${RANGE_DAYS} days`}
            />
          </div>

          <WeeklyChart daily={summary.daily} />

          {summary.bestDay ? (
            <p className="px-1 text-[11px] text-muted-foreground">
              Best day · {formatFullDate(summary.bestDay.date)} · {summary.bestDay.focusSessions}{" "}
              {summary.bestDay.focusSessions === 1 ? "pomodoro" : "pomodoros"} ·{" "}
              {formatDuration(summary.bestDay.focusMs)}
            </p>
          ) : null}

          {summary.byProject.length > 0 ? (
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-soft">
              <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Where the time went
              </h2>
              <ul className="flex flex-col gap-3.5">
                {summary.byProject.map((row) => {
                  // The bar is proportional to the total, so a light week still
                  // reads correctly; a sliver stays visible for tiny shares.
                  const share = summary.focusMs > 0 ? row.focusMs / summary.focusMs : 0
                  const color = row.color ? accentPreset(row.color).hex : null

                  return (
                    <li key={row.projectId ?? "no-project"} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px]">{row.name}</span>
                        <span className="tabular shrink-0 text-[13px] text-muted-foreground">
                          {formatDuration(row.focusMs)}
                          <span className="ml-1.5 text-[11px]">· {row.focusSessions}</span>
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{
                            width: `${Math.max(2, Math.round(share * 100))}%`,
                            backgroundColor: color ?? undefined,
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={TimerReset}
          title="No focus sessions yet."
          description="Finish a pomodoro and your progress will show up here."
        />
      )}
    </div>
  )
}
