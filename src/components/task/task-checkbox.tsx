"use client"

import { motion } from "framer-motion"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

/**
 * The completion control. Motion follows plan.md §19: the box pulses
 * 1.0 → 1.1 → 1.0, the row handles the strike-through.
 */
export function TaskCheckbox({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  className?: string
}) {
  return (
    <motion.div
      animate={checked ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("shrink-0", className)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        aria-label={label}
        className="size-[18px] rounded-full"
      />
    </motion.div>
  )
}
