"use client"

import { useCallback, useEffect, useState } from "react"
import { Flame, TimerReset } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/statistics/stat-card"
import { WeeklyChart } from "@/components/statistics/weekly-chart"
import { formatDuration } from "@/lib/dates"
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
            <StatCard
              label="Average focus"
              value={summary.averageFocusMs > 0 ? formatDuration(summary.averageFocusMs) : "—"}
              hint="per session"
            />
          </div>

          <WeeklyChart daily={summary.daily} />
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
