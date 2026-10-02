import { describe, expect, it } from "vitest"

import { isNewerVersion, parseVersion } from "@/lib/version"

describe("parseVersion", () => {
  it("reads the usual shapes", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3, prerelease: null })
    expect(parseVersion("v0.1.0")).toEqual({ major: 0, minor: 1, patch: 0, prerelease: null })
    expect(parseVersion("1.2.3-beta.4")).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: "beta.4",
    })
    expect(parseVersion("1.2.3+build.7")).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: null,
    })
    expect(parseVersion("  2.0.0  ")).toEqual({ major: 2, minor: 0, patch: 0, prerelease: null })
  })

  it("rejects anything else", () => {
    expect(parseVersion("1.2")).toBeNull()
    expect(parseVersion("release-notes")).toBeNull()
    expect(parseVersion("")).toBeNull()
    expect(parseVersion("1.2.3.4")).toBeNull()
  })
})

describe("isNewerVersion", () => {
  it("compares the numbers, not the text", () => {
    expect(isNewerVersion("0.2.0", "0.1.0")).toBe(true)
    expect(isNewerVersion("0.10.0", "0.9.0")).toBe(true)
    expect(isNewerVersion("0.1.10", "0.1.9")).toBe(true)
    expect(isNewerVersion("1.0.0", "0.99.99")).toBe(true)
  })

  it("is false for the same or an older release", () => {
    expect(isNewerVersion("0.1.0", "0.1.0")).toBe(false)
    expect(isNewerVersion("0.0.9", "0.1.0")).toBe(false)
    expect(isNewerVersion("0.9.0", "0.10.0")).toBe(false)
  })

  it("ignores a leading v on either side", () => {
    expect(isNewerVersion("v0.2.0", "0.1.0")).toBe(true)
    expect(isNewerVersion("0.2.0", "v0.1.0")).toBe(true)
  })

  it("sorts a prerelease below its release", () => {
    expect(isNewerVersion("1.0.0", "1.0.0-beta.1")).toBe(true)
    expect(isNewerVersion("1.0.0-beta.1", "1.0.0")).toBe(false)
  })

  it("orders prereleases numerically", () => {
    expect(isNewerVersion("1.0.0-beta.10", "1.0.0-beta.9")).toBe(true)
    expect(isNewerVersion("1.0.0-beta.2", "1.0.0-beta.10")).toBe(false)
  })

  it("never treats an unparseable version as an update", () => {
    expect(isNewerVersion("nightly", "0.1.0")).toBe(false)
    expect(isNewerVersion("0.2.0", "unknown")).toBe(false)
  })
})
