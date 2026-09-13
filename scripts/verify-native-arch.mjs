#!/usr/bin/env node
/**
 * Asserts that the native addon in node_modules was built for the architecture
 * we are packaging for.
 *
 * Cross-building (x64 runner, arm64 installer) is only correct if the matching
 * prebuilt binary was fetched first. Otherwise electron-builder packages the
 * host's addon without complaint and the installer dies on launch inside
 * better-sqlite3, with nothing in the message pointing at the real cause.
 *
 * Usage: node scripts/verify-native-arch.mjs <x64|arm64|ia32>
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Machine field values from the PE/COFF spec. */
const MACHINE = { x64: 0x8664, arm64: 0xaa64, ia32: 0x014c }

const [arch] = process.argv.slice(2)
const expected = MACHINE[arch]

if (!expected) {
  console.error(`[verify-native-arch] expected one of ${Object.keys(MACHINE).join(", ")}, got "${arch ?? ""}"`)
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const binary = path.join(root, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node")

let header
try {
  header = fs.readFileSync(binary)
} catch {
  console.error(`[verify-native-arch] ${path.relative(root, binary)} is missing — did the install step run?`)
  process.exit(1)
}

// At offset 0x3C sits the offset of the COFF header, whose first field is the
// two-byte Machine field. This is the only reliable way to tell an arm64 PE
// from an x64 one without a toolchain on the box.
const coff = header.readUInt32LE(0x3c)
const machine = header.readUInt16LE(coff + 4)

if (machine !== expected) {
  console.error(
    `[verify-native-arch] better_sqlite3.node is machine 0x${machine.toString(16)}, ` +
      `but ${arch} needs 0x${expected.toString(16)}`,
  )
  console.error("[verify-native-arch] refetch the prebuild for the target arch before packaging")
  process.exit(1)
}

console.log(`[verify-native-arch] better_sqlite3.node matches ${arch} (0x${expected.toString(16)})`)
