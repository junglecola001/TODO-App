import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * FocusFlow is an offline desktop app: the renderer is exported to static
   * HTML/JS/CSS and served by Electron over the `focusflow://` protocol.
   * There is no server at runtime, so never add API routes, server actions or
   * dynamic routes that would need one.
   */
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
}

export default nextConfig
