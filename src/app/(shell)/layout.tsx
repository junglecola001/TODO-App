import type { ReactNode } from "react"

import { AppShell } from "@/components/layout/app-shell"

/** Every route in this group shares the window chrome and the sidebar. */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
