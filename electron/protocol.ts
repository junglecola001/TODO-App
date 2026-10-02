import { promises as fs } from "node:fs"
import path from "node:path"

import { protocol } from "electron"

import { rendererRoot } from "./lib/paths"

export const APP_SCHEME = "focusflow"
export const APP_HOST = "app"
/** The renderer's origin: a real, secure origin, so localStorage and history work. */
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`

/**
 * The renderer is a self-contained static export, so it can run under a strict
 * policy: no `eval`, no remote origins, no plugins. Inline scripts and styles
 * are allowed because Next.js inlines its hydration bootstrap and framer-motion
 * writes inline styles. This header is what makes Electron's "Insecure
 * Content-Security-Policy" warning go away (plan.md §23).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "media-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ")

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
}

/** Must be called before `app.whenReady()` so the scheme gets standard/secure privileges. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ])
}

/**
 * Serves the exported renderer over `focusflow://app/...`.
 * Files are read through `fs`, which keeps working inside an asar archive.
 */
export function registerAppProtocol(): void {
  const root = rendererRoot()

  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url)
    const target = resolveWithinRoot(root, decodeURIComponent(url.pathname))

    if (!target) {
      return new Response("Bad request", { status: 400 })
    }

    const file = await resolveFile(target)
    if (!file) {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } })
    }

    const body = await fs.readFile(file)
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "content-security-policy": CONTENT_SECURITY_POLICY,
        "cache-control": "no-cache",
      },
    })
  })
}

/** Resolves a request path inside the export root, rejecting traversal attempts. */
function resolveWithinRoot(root: string, pathname: string): string | null {
  const relative = pathname.replace(/^\/+/, "")
  const normalizedRoot = path.resolve(root)
  const target = path.resolve(normalizedRoot, relative || "index.html")

  if (target !== normalizedRoot && !target.startsWith(normalizedRoot + path.sep)) {
    return null
  }
  return target
}

/**
 * Static exports write one directory per route (`/today/` -> `today/index.html`),
 * so extension-less paths are probed as directories and then as documents.
 */
async function resolveFile(target: string): Promise<string | null> {
  const candidates = path.extname(target)
    ? [target]
    : [target, path.join(target, "index.html"), `${target}.html`]

  for (const candidate of candidates) {
    const stats = await statFile(candidate)
    if (stats) return candidate
  }

  // Unknown route: fall back to the exported 404 page when it exists.
  const notFound = path.join(rendererRoot(), "404.html")
  if (await statFile(notFound)) return notFound

  return null
}

async function statFile(candidate: string) {
  try {
    const stats = await fs.stat(candidate)
    return stats.isFile() ? stats : null
  } catch {
    return null
  }
}
