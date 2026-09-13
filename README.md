# FocusFlow

A calm, premium Todo + Pomodoro workspace for Windows. Offline-first: every task,
project and focus session is stored locally in SQLite — no account, no network.

> **Less UI, More Focus.**

---

## Requirements

- **Windows 10/11** (primary target)
- **Node.js 22+** (`better-sqlite3` requires it)
- No build tools needed: `better-sqlite3` ships prebuilt N-API binaries for
  `win32-x64` and `win32-arm64`, and they work in Electron without a rebuild.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the Next.js dev server and the Electron shell together. The
window retries until the dev server is ready, so start-up order never matters.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server + Electron window (development) |
| `npm run build` | Exports the renderer to `out/` (static, offline) |
| `npm run build:electron` | Bundles `electron/` to `dist-electron/` |
| `npm run build:app` | Both of the above |
| `npm run preview` | Builds, then runs Electron against `out/` like a packaged app |
| `npm run dist` | Builds and produces the Windows installer in `release/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js + TypeScript rules) |

## Architecture

```text
Component
   ↓
Zustand store
   ↓
src/lib/ipc.ts            (typed bridge)
   ↓
electron/preload.ts       (contextBridge — the only exposed surface)
   ↓
electron/ipc/*            (ipcMain handlers)
   ↓
electron/db/repositories  (data access)
   ↓
SQLite  (%APPDATA%/FocusFlow/focusflow.db)
```

- The renderer is a **static export** (`next build` → `out/`). There is no server
  at runtime; Electron serves the files over the `focusflow://` protocol, which
  gives the app a real, secure origin (so `localStorage` and history work).
- The renderer **never** touches Node.js, the filesystem or SQLite. Everything
  goes through a narrow, typed IPC surface.
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

### Layout

```text
electron/            main process, preload, window, protocol, IPC handlers
scripts/             esbuild bundling, icon generation, production preview
src/app/             Next.js App Router routes (Today, Inbox, …)
src/components/      ui/ (shadcn), layout/, task/, timer/, statistics/, …
src/lib/             ipc client, constants, formatting helpers
src/stores/          Zustand stores
src/types/           shared domain + IPC types
```

### Data location

```text
%APPDATA%/FocusFlow/
└── focusflow.db
```

The database is never written to the install directory.

## Design system

- Tokens live in `src/app/globals.css` as HSL channel triplets; `tailwind.config.ts`
  only maps names to those tokens, so re-theming never touches component code.
- Default accent is `#FF5A5F`, and Settings can switch between Red / Orange /
  Blue / Purple / Green. The accent is used deliberately (primary actions, the
  timer ring, active navigation) — never as decoration.
- Light: `#F7F7F5` canvas, `#FFFFFF` surface, `#171717` text, `#E8E8E5` border.
- Dark: `#111111` canvas, `#181818` surface, `#F5F5F5` text, `#292929` border.
- Icons: **Lucide** only. Animation: **Framer Motion** only.

## Status

Phase 0 (project setup) and Phase 1 (design system) are complete. See
`plan.md` for the full roadmap.
