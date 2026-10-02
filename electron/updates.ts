import { app, shell } from "electron"

import { isNewerVersion } from "@/lib/version"
import type { UpdateCheckResult } from "@/types/ipc"

/**
 * FocusFlow checks for updates by asking GitHub for the newest release and
 * comparing it with the running version. It deliberately does **not** download
 * or install anything (plan.md §24: local-first, and no network call the user
 * did not ask for) — it points at the release page instead.
 *
 * The repository is hard-coded, and `openRelease` only ever opens the URL that
 * came back from that repository: the renderer cannot ask the main process to
 * open an arbitrary address.
 */
const RELEASE_OWNER = "junglecola001"
const RELEASE_REPO = "TODO-App"

const RELEASES_PAGE = `https://github.com/${RELEASE_OWNER}/${RELEASE_REPO}/releases`
const LATEST_RELEASE_API = `https://api.github.com/repos/${RELEASE_OWNER}/${RELEASE_REPO}/releases/latest`

/** Long enough for a slow connection, short enough not to look frozen. */
const REQUEST_TIMEOUT_MS = 8_000

interface GithubRelease {
  tag_name?: unknown
  html_url?: unknown
  published_at?: unknown
}

let lastReleaseUrl: string | null = null

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion()

  try {
    const response = await fetch(LATEST_RELEASE_API, {
      headers: {
        accept: "application/vnd.github+json",
        // GitHub rejects requests without a user agent.
        "user-agent": `FocusFlow/${currentVersion}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (response.status === 404) {
      return {
        state: "unavailable",
        currentVersion,
        latestVersion: null,
        releaseUrl: RELEASES_PAGE,
        publishedAt: null,
        message: "No release has been published yet.",
      }
    }

    if (!response.ok) {
      return {
        state: "error",
        currentVersion,
        latestVersion: null,
        releaseUrl: RELEASES_PAGE,
        publishedAt: null,
        message: `The release server answered ${response.status}.`,
      }
    }

    const release = (await response.json()) as GithubRelease
    const tag = typeof release.tag_name === "string" ? release.tag_name : ""
    const latestVersion = tag.replace(/^v/, "")
    const releaseUrl = typeof release.html_url === "string" ? release.html_url : RELEASES_PAGE
    const publishedAt = typeof release.published_at === "string" ? release.published_at : null

    lastReleaseUrl = releaseUrl

    if (isNewerVersion(latestVersion, currentVersion)) {
      return {
        state: "available",
        currentVersion,
        latestVersion,
        releaseUrl,
        publishedAt,
        message: null,
      }
    }

    return {
      state: "up-to-date",
      currentVersion,
      latestVersion: latestVersion || currentVersion,
      releaseUrl,
      publishedAt,
      message: null,
    }
  } catch (error) {
    return {
      state: "error",
      currentVersion,
      latestVersion: null,
      releaseUrl: RELEASES_PAGE,
      publishedAt: null,
      message:
        error instanceof Error && error.name === "TimeoutError"
          ? "The release server took too long to answer."
          : "Could not reach the release server.",
    }
  }
}

/** Opens the page the last check pointed at; the releases list before any check. */
export async function openReleasePage(): Promise<void> {
  await shell.openExternal(lastReleaseUrl ?? RELEASES_PAGE)
}
