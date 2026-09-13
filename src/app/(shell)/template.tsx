"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Page transition: a 4px lift and a fade, replayed on every route change.
 * Living inside the shell (rather than at the root) keeps the sidebar and the
 * timer from re-mounting when you navigate.
 */
export default function ShellTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex min-h-full flex-col"
    >
      {children}
    </motion.div>
  )
}
