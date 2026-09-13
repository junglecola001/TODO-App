#!/usr/bin/env node
/**
 * Bundles the Electron main process and preload script with esbuild.
 *
 * Both entry points are TypeScript compiled to CommonJS in `dist-electron/`:
 * commonjs because Electron loads the main process and sandboxed preload
 * scripts without an ES module loader. `electron` and `better-sqlite3`
 * (a native N-API addon) stay external and are resolved from node_modules.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { build } from "esbuild"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".mjs", ".js", ".json"]

/** Mirrors the `"@/*": ["./src/*"]` mapping from tsconfig.json. */
const aliasPlugin = {
  name: "focusflow-alias",
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@\// }, (args) => {
      const resolved = resolveFile(path.join(root, "src", args.path.slice(2)))
      if (!resolved) {
        return { errors: [{ text: `Cannot resolve ${args.path} (imported by ${args.importer})` }] }
      }
      return { path: resolved }
    })
  },
}

function isFile(candidate) {
  try {
    return fs.statSync(candidate).isFile()
  } catch {
    return false
  }
}

function resolveFile(base) {
  for (const extension of ["", ...RESOLVE_EXTENSIONS]) {
    const candidate = `${base}${extension}`
    if (isFile(candidate)) return candidate
  }
  for (const extension of RESOLVE_EXTENSIONS) {
    const candidate = path.join(base, `index${extension}`)
    if (isFile(candidate)) return candidate
  }
  return null
}

const shared = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  sourcemap: true,
  logLevel: "info",
  absWorkingDir: root,
  external: ["electron", "better-sqlite3"],
  plugins: [aliasPlugin],
}

const targets = [
  { entryPoints: ["electron/main.ts"], outfile: "dist-electron/main.js" },
  { entryPoints: ["electron/preload.ts"], outfile: "dist-electron/preload.js" },
]

await Promise.all(targets.map((target) => build({ ...shared, ...target })))

console.log(`[build-electron] bundled ${targets.length} entry points into dist-electron/`)
