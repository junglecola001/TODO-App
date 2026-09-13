import {
  Book,
  Briefcase,
  Camera,
  Code,
  Dumbbell,
  FlaskConical,
  Folder,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Music,
  Palette,
  Plane,
  Sparkles,
  User,
  Utensils,
  type LucideIcon,
} from "lucide-react"
import { createElement, type CSSProperties } from "react"

/**
 * Projects store an icon *name*; this curated map keeps only the icons we
 * actually offer in the bundle instead of pulling in all of Lucide.
 */
export const PROJECT_ICONS = {
  folder: Folder,
  "graduation-cap": GraduationCap,
  music: Music,
  user: User,
  book: Book,
  briefcase: Briefcase,
  heart: Heart,
  code: Code,
  palette: Palette,
  dumbbell: Dumbbell,
  home: Home,
  "flask-conical": FlaskConical,
  camera: Camera,
  "gamepad-2": Gamepad2,
  plane: Plane,
  utensils: Utensils,
  sparkles: Sparkles,
} satisfies Record<string, LucideIcon>

export type ProjectIconName = keyof typeof PROJECT_ICONS

export const PROJECT_ICON_NAMES = Object.keys(PROJECT_ICONS) as ProjectIconName[]

export function resolveProjectIcon(name: string): LucideIcon {
  return PROJECT_ICONS[name as ProjectIconName] ?? Folder
}

export function ProjectIcon({
  name,
  className,
  style,
}: {
  name: string
  className?: string
  style?: CSSProperties
}) {
  // `createElement` rather than a capitalised local variable: this is a lookup
  // in a module-level map of stable icons, not a component defined in render.
  return createElement(resolveProjectIcon(name), { className, style })
}
