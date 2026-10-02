export interface ParsedVersion {
  major: number
  minor: number
  patch: number
  /** Everything after the first `-`, or null for a plain release. */
  prerelease: string | null
}

/**
 * Parses `1.2.3`, `v1.2.3`, `1.2.3-beta.4` and `1.2.3+build`.
 * Returns null for anything that is not a semantic version, so a surprising tag
 * can never look like an update.
 */
export function parseVersion(value: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([^+]*))?(?:\+.*)?$/.exec(value.trim())
  if (!match) return null

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4] : null,
  }
}

/**
 * True when `candidate` is a strictly newer release than `current`.
 * A prerelease sorts below the release with the same numbers, and an
 * unparseable version is never treated as newer.
 */
export function isNewerVersion(candidate: string, current: string): boolean {
  const next = parseVersion(candidate)
  const installed = parseVersion(current)
  if (!next || !installed) return false

  if (next.major !== installed.major) return next.major > installed.major
  if (next.minor !== installed.minor) return next.minor > installed.minor
  if (next.patch !== installed.patch) return next.patch > installed.patch

  // Same numbers: a release outranks a prerelease of itself.
  if (next.prerelease && !installed.prerelease) return false
  if (!next.prerelease && installed.prerelease) return true
  if (next.prerelease && installed.prerelease) {
    // "beta.10" must sort above "beta.9", hence numeric-aware comparison.
    return next.prerelease.localeCompare(installed.prerelease, undefined, { numeric: true }) > 0
  }

  return false
}
