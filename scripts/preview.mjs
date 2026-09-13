#!/usr/bin/env node
/**
 * Runs the app against the already exported renderer in `out/`, the same way a
 * packaged build behaves — useful to check the production bundle without
 * building an installer. Run `npm run build` first (or `npm run preview`).
 */
import { spawn } from "node:child_process"

import electron from "electron"

const child = spawn(electron, ["."], {
  stdio: "inherit",
  env: { ...process.env, FOCUSFLOW_USE_EXPORT: "1" },
})

child.on("close", (code) => {
  process.exit(code ?? 0)
})
