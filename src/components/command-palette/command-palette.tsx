"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  CalendarDays,
  CornerDownLeft,
  FolderPlus,
  Inbox,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Settings,
  SkipForward,
  Sun,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DialogTitle } from "@/components/ui/dialog"
import { formatDueDate } from "@/lib/dates"
import { TIMER_PHASE_LABELS } from "@/lib/timer"
import { useTaskStore } from "@/stores/task-store"
import { useTimerStore } from "@/stores/timer-store"
import { useUiStore } from "@/stores/ui-store"

const MAX_TASK_RESULTS = 50

const NAVIGATION = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

/** Ctrl+K: commands, task search and navigation in one place (plan.md §18). */
export function CommandPalette() {
  const open = useUiStore((store) => store.commandPaletteOpen)
  const close = useUiStore((store) => store.closeCommandPalette)
  const openQuickAdd = useUiStore((store) => store.openQuickAdd)
  const openProjectDialog = useUiStore((store) => store.openProjectDialog)
  const focusMode = useUiStore((store) => store.focusMode)
  const toggleFocusMode = useUiStore((store) => store.toggleFocusMode)

  const tasks = useTaskStore((store) => store.tasks)
  const state = useTimerStore((store) => store.state)
  const start = useTimerStore((store) => store.start)
  const pause = useTimerStore((store) => store.pause)
  const resume = useTimerStore((store) => store.resume)
  const skip = useTimerStore((store) => store.skip)

  const router = useRouter()

  const openTasks = useMemo(
    () => tasks.filter((task) => !task.completed).slice(0, MAX_TASK_RESULTS),
    [tasks]
  )

  const run = (action: () => void) => {
    close()
    action()
  }

  const running = state.status === "running"
  const paused = state.status === "paused"

  return (
    <CommandDialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogTitle className="sr-only">Command palette</DialogTitle>
      <CommandInput placeholder="Type a command or search tasks…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Timer">
          {running ? (
            <CommandItem value="pause timer" onSelect={() => run(() => void pause())}>
              <Pause />
              Pause
            </CommandItem>
          ) : (
            <CommandItem
              value={`start ${TIMER_PHASE_LABELS[state.phase]}`}
              onSelect={() => run(() => void (paused ? resume() : start()))}
            >
              <Play />
              {paused ? "Resume" : `Start ${TIMER_PHASE_LABELS[state.phase].toLowerCase()}`}
            </CommandItem>
          )}
          <CommandItem value="skip phase" onSelect={() => run(() => void skip())}>
            <SkipForward />
            Skip to the next phase
          </CommandItem>
          <CommandItem
            value={focusMode ? "exit focus mode" : "enter focus mode"}
            onSelect={() => run(toggleFocusMode)}
          >
            {focusMode ? <Minimize2 /> : <Maximize2 />}
            {focusMode ? "Exit focus mode" : "Enter focus mode"}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="add task new" onSelect={() => run(openQuickAdd)}>
            <Plus />
            Add task
          </CommandItem>
          <CommandItem value="new project create" onSelect={() => run(() => openProjectDialog())}>
            <FolderPlus />
            New project
          </CommandItem>
        </CommandGroup>

        {openTasks.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Focus on a task">
              {openTasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={task.title}
                  onSelect={() => run(() => void start({ phase: "focus", taskId: task.id }))}
                >
                  <Play />
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  {task.dueDate ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDueDate(task.dueDate)}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />

        <CommandGroup heading="Go to">
          {NAVIGATION.map((item) => (
            <CommandItem
              key={item.href}
              value={`go to ${item.label}`}
              onSelect={() => run(() => router.push(item.href))}
            >
              <item.icon />
              {item.label}
              <CornerDownLeft className="ml-auto size-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
