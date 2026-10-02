import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

/**
 * Unit and integration tests run in plain Node — no Electron, no renderer. The
 * `@/` alias mirrors tsconfig.json so tests import exactly what the app does.
 *
 * `.mts` on purpose: the package is CommonJS, and a `.ts` config would be loaded
 * as CJS while containing ESM syntax.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
