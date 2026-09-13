#!/usr/bin/env node
/**
 * Renders the icon electron-builder embeds in the installer and executable.
 *
 * The drawing code lives in `electron/assets/icon.ts` and is reused here by
 * bundling it on the fly, so the packaged icon always matches the window icon.
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { build } from "esbuild"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const cacheDir = path.join(root, "node_modules", ".cache", "focusflow")
const bundlePath = path.join(cacheDir, "icon.mjs")

await fs.mkdir(cacheDir, { recursive: true })

await build({
  entryPoints: [path.join(root, "electron", "assets", "icon.ts")],
  outfile: bundlePath,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  logLevel: "warning",
})

const { renderAppIcon } = await import(pathToFileURL(bundlePath).href)

const buildDir = path.join(root, "build")
await fs.mkdir(buildDir, { recursive: true })

// electron-builder wants at least 256x256 and derives the .ico itself.
const icon = renderAppIcon(512)
await fs.writeFile(path.join(buildDir, "icon.png"), icon)

console.log(`[icons] wrote build/icon.png (512x512, ${icon.length} bytes)`)
