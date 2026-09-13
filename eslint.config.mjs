import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

export default [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist-electron/**",
      "release/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
]
