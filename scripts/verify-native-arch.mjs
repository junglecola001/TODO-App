#!/usr/bin/env node
/**
 * Asserts that the packaged app carries a native addon built for the
 * architecture we are shipping.
 *
 * better-sqlite3 v13 ships every platform's prebuild inside the npm tarball and
 * picks one at runtime from `process.arch`, so cross-building needs no
 * special step — but it does mean a wrong `files` glob or a broken `asarUnpack`
 * can quietly leave the target's binary out of the installer. That produces an
 * installer that downloads and installs fine and only dies on first launch, so
 * this checks the real payload rather than node_modules.
 *
 * Usage: node scripts/verify-native-arch.mjs <x64|arm64|ia32> [dir]
 * `dir` defaults to release/win-unpacked, the tree electron-builder packs.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Machine field values from the PE/COFF spec. */
const MACHINE = { x64: 0x8664, arm64: 0xaa64, ia32: 0x014c }

const [arch, dirArg] = process.argv.slice(2)
const expected = MACHINE[arch]

if (!expected) {
  console.error(`[verify-native-arch] expected one of ${Object.keys(MACHINE).join(", ")}, got "${arch ?? ""}"`)
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const tree = path.resolve(root, dirArg ?? path.join("release", "win-unpacked"))

/** Reads the Machine field out of a PE file: 0x3C holds the COFF header offset. */
function machineOf(file) {
  const header = fs.readFileSync(file)
  return header.readUInt16LE(header.readUInt32LE(0x3c) + 4)
}

function find(dir, match, found = [], seen = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return found
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) find(full, match, found, seen)
    else if (entry.name.endsWith(".node")) {
      seen.push(path.relative(root, full))
      if (match(entry.name)) found.push(full)
    }
  }
  found.seen = seen
  return found
}

if (!fs.existsSync(tree)) {
  console.error(`[verify-native-arch] ${path.relative(root, tree)} does not exist — did the build run?`)
  process.exit(1)
}

const wanted = `win32-${arch}.node`
const matches = find(tree, (name) => name === wanted)

if (matches.length === 0) {
  console.error(`[verify-native-arch] no ${wanted} anywhere under ${path.relative(root, tree)}`)
  const seen = matches.seen ?? []
  console.error(
    seen.length
      ? `[verify-native-arch] packaged .node files were:\n  ${seen.join("\n  ")}`
      : "[verify-native-arch] the package contains no .node files at all",
  )
  console.error("[verify-native-arch] check the `files` and `asarUnpack` globs in package.json")
  process.exit(1)
}

let failed = false
for (const file of matches) {
  const machine = machineOf(file)
  const label = path.relative(root, file)
  if (machine !== expected) {
    console.error(`[verify-native-arch] ${label} is machine 0x${machine.toString(16)}, expected 0x${expected.toString(16)}`)
    failed = true
  } else {
    console.log(`[verify-native-arch] ${label} matches ${arch} (0x${expected.toString(16)})`)
  }
}

process.exit(failed ? 1 : 0)
