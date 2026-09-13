"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Page transition: a 4px lift and a fade, replayed on every route change.
 * Fast and soft — it must never get in the way of starting work.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  )
}
