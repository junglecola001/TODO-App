"use client"

import { ProjectIcon } from "@/components/layout/project-icon"
import { PriorityIcon } from "@/components/task/priority-icon"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { accentPreset, PRIORITIES, PRIORITY_LABELS, type Priority } from "@/lib/constants"
import type { Project } from "@/types/domain"

/** Radix Select cannot use an empty string as a value, so "none" needs a token. */
export const NO_PROJECT = "__none__"

export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority
  onChange: (value: Priority) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Priority)}>
      <SelectTrigger className="h-8 w-[132px] text-[13px]" aria-label="Priority">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITIES.map((priority) => (
          <SelectItem key={priority} value={priority}>
            <span className="flex items-center gap-2">
              <PriorityIcon priority={priority} />
              {PRIORITY_LABELS[priority]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ProjectPicker({
  value,
  projects,
  onChange,
}: {
  value: string | null
  projects: Project[]
  onChange: (value: string | null) => void
}) {
  return (
    <Select
      value={value ?? NO_PROJECT}
      onValueChange={(next) => onChange(next === NO_PROJECT ? null : next)}
    >
      <SelectTrigger className="h-8 w-[160px] text-[13px]" aria-label="Project">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_PROJECT}>
          <span className="text-muted-foreground">No project</span>
        </SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <span className="flex items-center gap-2">
              <ProjectIcon
                name={project.icon}
                className="size-3.5"
                style={{ color: accentPreset(project.color).hex }}
              />
              {project.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
