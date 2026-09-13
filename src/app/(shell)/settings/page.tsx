"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, TriangleAlert, Volume2, type LucideIcon } from "lucide-react"

import { PageHeader } from "@/components/common/page-header"
import { SettingRow, SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useMounted } from "@/hooks/use-mounted"
import { ACCENT_PRESETS, TIMER_LIMITS } from "@/lib/constants"
import { ipc } from "@/lib/ipc"
import { playSound } from "@/lib/sounds"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/stores/settings-store"
import type { SystemInfo } from "@/types/ipc"
import type { ThemeMode } from "@/types/settings"

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

/** Shortcuts that only work while FocusFlow has focus (plan.md §17). */
const IN_APP_SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["Ctrl", "N"], label: "New task" },
  { keys: ["Ctrl", "K"], label: "Command palette" },
  { keys: ["Ctrl", "Shift", "F"], label: "Focus mode" },
  { keys: ["Esc"], label: "Leave focus mode" },
]

export default function SettingsPage() {
  const mounted = useMounted()
  const { theme, setTheme } = useTheme()

  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.update)

  const [system, setSystem] = useState<SystemInfo | null>(null)

  useEffect(() => {
    let active = true

    ipc.system
      .getInfo()
      .then((info) => {
        if (active) setSystem(info)
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  const activeTheme: ThemeMode = mounted ? ((theme as ThemeMode) ?? "system") : "system"

  const chooseTheme = (mode: ThemeMode) => {
    // next-themes applies it instantly; the database keeps it authoritative.
    setTheme(mode)
    void updateSettings({ theme: mode })
  }

  const autoLaunchMismatch = system !== null && system.autoLaunchEnabled !== settings.startAtLogin

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-8 py-10">
      <PageHeader
        title="Settings"
        description="FocusFlow runs entirely on this device — nothing leaves your computer."
      />

      <SettingsSection title="Appearance">
        <SettingRow label="Theme" description="Follow Windows, or pick a mode yourself.">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-1">
            {THEME_OPTIONS.map((option) => {
              const isActive = activeTheme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => chooseTheme(option.value)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <option.icon className="size-3.5" strokeWidth={1.9} />
                  {option.label}
                </button>
              )
            })}
          </div>
        </SettingRow>

        <SettingRow
          label="Accent color"
          description="Used for primary actions, the active view and the focus ring."
        >
          <div className="flex items-center gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const isActive = preset.id === settings.accent
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={preset.label}
                  aria-pressed={isActive}
                  title={preset.label}
                  onClick={() => void updateSettings({ accent: preset.id })}
                  style={{ backgroundColor: preset.hex }}
                  className={cn(
                    "size-6 rounded-full border border-black/10 transition-transform duration-150 hover:scale-105",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive && "ring-2 ring-ring/60 ring-offset-2 ring-offset-background"
                  )}
                />
              )
            })}
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Timer">
        <DurationRow
          label="Focus"
          description="Length of one focus session."
          value={settings.focusMinutes}
          limit={TIMER_LIMITS.focusMinutes}
          onChange={(value) => void updateSettings({ focusMinutes: value })}
        />
        <DurationRow
          label="Short break"
          description="The pause after a focus session."
          value={settings.shortBreakMinutes}
          limit={TIMER_LIMITS.shortBreakMinutes}
          onChange={(value) => void updateSettings({ shortBreakMinutes: value })}
        />
        <DurationRow
          label="Long break"
          description="The pause after a full cycle."
          value={settings.longBreakMinutes}
          limit={TIMER_LIMITS.longBreakMinutes}
          onChange={(value) => void updateSettings({ longBreakMinutes: value })}
        />
        <DurationRow
          label="Long break interval"
          description="Focus sessions before a long break."
          unit="sessions"
          value={settings.longBreakInterval}
          limit={TIMER_LIMITS.longBreakInterval}
          onChange={(value) => void updateSettings({ longBreakInterval: value })}
        />
      </SettingsSection>

      <SettingsSection title="Notifications">
        <SettingRow label="Focus complete" description="Tell me when a focus session ends.">
          <Switch
            aria-label="Notify when a focus session ends"
            checked={settings.notifyOnFocusComplete}
            onCheckedChange={(checked) => void updateSettings({ notifyOnFocusComplete: checked })}
          />
        </SettingRow>
        <SettingRow label="Break complete" description="Tell me when a break is over.">
          <Switch
            aria-label="Notify when a break ends"
            checked={settings.notifyOnBreakComplete}
            onCheckedChange={(checked) => void updateSettings({ notifyOnBreakComplete: checked })}
          />
        </SettingRow>
        <SettingRow label="Sound" description="Soft chimes for starting, finishing and breaks.">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Preview the completion sound"
              onClick={() => playSound("focusComplete")}
            >
              <Volume2 className="size-3.5" />
            </Button>
            <Switch
              aria-label="Play sounds"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => void updateSettings({ soundEnabled: checked })}
            />
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Behavior">
        <SettingRow
          label="Start with Windows"
          description="Launch FocusFlow when you sign in."
        >
          <div className="flex flex-col items-end gap-1">
            <Switch
              aria-label="Start FocusFlow with Windows"
              checked={settings.startAtLogin}
              onCheckedChange={(checked) => void updateSettings({ startAtLogin: checked })}
            />
          </div>
        </SettingRow>

        {autoLaunchMismatch ? (
          <p className="flex items-start gap-2 py-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-500">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            Windows currently reports a different startup state. It may need a sign-out to catch up.
          </p>
        ) : null}

        <SettingRow
          label="Close to tray"
          description="Closing the window keeps the timer running in the notification area."
        >
          <Switch
            aria-label="Close the window to the tray"
            checked={settings.closeToTray}
            onCheckedChange={(checked) => void updateSettings({ closeToTray: checked })}
          />
        </SettingRow>

        <SettingRow
          label="Start the next session automatically"
          description="Breaks and focus sessions begin without pressing start."
        >
          <Switch
            aria-label="Start the next session automatically"
            checked={settings.autoStartNextSession}
            onCheckedChange={(checked) => void updateSettings({ autoStartNextSession: checked })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Shortcuts">
        <div className="flex flex-col gap-2.5 py-3.5">
          <p className="text-[13px] font-medium">From anywhere</p>
          {system ? (
            <ul className="flex flex-col gap-2">
              {system.shortcuts.map((shortcut) => (
                <li key={shortcut.accelerator} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    {keysOf(shortcut.accelerator).map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                    <span className="ml-1">{shortcut.label}</span>
                  </span>
                  {shortcut.registered ? null : (
                    <span className="shrink-0 text-[11px] text-amber-600 dark:text-amber-500">
                      In use by another app
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Only available in the desktop app.</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5 py-3.5">
          <p className="text-[13px] font-medium">While FocusFlow is focused</p>
          <ul className="flex flex-col gap-2">
            {IN_APP_SHORTCUTS.map((shortcut) => (
              <li key={shortcut.label} className="flex items-center gap-1.5">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
                <span className="ml-1 text-[13px] text-muted-foreground">{shortcut.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </SettingsSection>
    </div>
  )
}

function DurationRow({
  label,
  description,
  value,
  limit,
  unit = "min",
  onChange,
}: {
  label: string
  description: string
  value: number
  limit: { min: number; max: number; step: number }
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <SettingRow label={label} description={description}>
      <div className="flex items-center gap-3">
        <Slider
          aria-label={label}
          className="w-36"
          value={[value]}
          min={limit.min}
          max={limit.max}
          step={limit.step}
          onValueChange={(values) => {
            const next = values[0]
            if (typeof next === "number") onChange(next)
          }}
        />
        <span className="w-16 text-right text-[13px] tabular text-muted-foreground">
          {value} {unit}
        </span>
      </div>
    </SettingRow>
  )
}

function keysOf(accelerator: string): string[] {
  return accelerator
    .split("+")
    .map((part) => (part === "Control" || part === "CommandOrControl" ? "Ctrl" : part))
}
