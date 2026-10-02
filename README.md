# FocusFlow

A calm, premium Todo + Pomodoro workspace for Windows. Offline-first: every task,
project and focus session is stored locally in SQLite — no account, no network.

> **Less UI, More Focus.**

---

## Requirements

- **Windows 10/11** (primary target)
- **Node.js 22+** (`better-sqlite3` requires it)
- No C++ toolchain is needed to *run* FocusFlow: `better-sqlite3` ships prebuilt
  N-API binaries for `win32-x64` and `win32-arm64` that load in Electron as they
  are (`npmRebuild` is off). Installing still triggers its implicit
  `node-gyp rebuild` through npm, and that step wants Visual Studio's "Desktop
  development with C++" workload. Without it, install with
  `npm ci --ignore-scripts` and the prebuilt binary is used instead. CI is
  unaffected — `windows-latest` ships the toolchain.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the Next.js dev server and the Electron shell together. The
window retries until the dev server is ready, so start-up order never matters.

If you installed with `--ignore-scripts`, that also skips Electron's own binary
download, so `npm run dev` has no runtime to launch. Fetch it once with
`node node_modules/electron/install.js`; the script is idempotent and returns
immediately when the binary is already there.

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
| `npm test` | Vitest: unit tests plus the data-layer integration tests |
| `npm run test:watch` | The same suite in watch mode |

## Architecture

```text
Component
   ↓
Zustand store
   ↓
src/lib/ipc.ts                     (typed bridge)
   ↓
electron/preload.ts                (contextBridge — the only exposed surface)
   ↓
electron/ipc/*                     (ipcMain handlers)
   ↓
electron/db/repositories/*         (data access)
   ↓
SQLite  (%APPDATA%/FocusFlow/focusflow.db)
```

- The renderer is a **static export** (`next build` → `out/`). There is no server
  at runtime; Electron serves the files over the `focusflow://` protocol, which
  gives the app a real, secure origin (so `localStorage` and history work).
- The renderer **never** touches Node.js, the filesystem or SQLite. Everything
  goes through a narrow, typed IPC surface.
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

### Where things live

```text
electron/
  main.ts             app lifecycle, single instance, wiring
  window.ts           frameless window, close-to-tray, navigation guards
  protocol.ts         focusflow:// handler serving out/ (+ the CSP header)
  tray.ts             notification-area icon, menu, live tooltip
  shortcuts.ts        system-wide shortcuts + conflict reporting
  system.ts           Windows login item
  updater.ts          release check (GitHub API) — notify only, never installs
  notifications.ts    phase-complete and first-hide notifications
  timer/              the Pomodoro engine (main process, real-clock maths)
  db/                 schema, migrations, repositories
  ipc/                one module per feature; handlers only, no SQL
src/
  app/(shell)/        Today, Inbox, Upcoming, Projects, Statistics, Settings
  components/         ui/ (shadcn), layout/, task/, timer/, project/, statistics/, command-palette/
  stores/             Zustand: tasks, projects, settings, timer, UI
  lib/                ipc client, dates, task views, parser, sounds, timer helpers, version
tests/                Vitest: pure logic + the data layer against a real SQLite file
```

### Noteworthy decisions

- **Timer in the main process.** It keeps running while the window is hidden to
  the tray, and the tray and notifications read the same state. It never counts
  down: the remaining time is derived from `startedAt` + `durationMs`, which is
  what makes it immune to throttling and sleep.
- **`due_date` is a local calendar date** (`YYYY-MM-DD`), never a timestamp, so
  "today" cannot drift across time zones. Statistics convert epoch milliseconds
  with SQLite's `localtime` modifier for the same reason.
- **The accent color is applied as `--primary`** at runtime; project colors are
  data and stay inline. Extra neutral palettes (Warm / Cool) are plain token
  sets in `globals.css`, selected by a `data-palette` attribute.
- **Sounds are synthesised** with the Web Audio API — no audio assets. Settings
  chooses the family (soft bell / gentle chime / subtle click / minimal) and the
  volume; the tables live in `src/lib/sounds.ts`.
- **Updates are notified, never installed.** `electron/updater.ts` asks GitHub
  for the newest release and, if it is newer, offers the release page. There is
  no downloader, so the app still ships with a single runtime dependency
  (`better-sqlite3`), and nothing is fetched unless the user asks.
- **The renderer runs under a Content-Security-Policy** served with the
  `focusflow://` response: no `eval`, no remote origins, no plugins.
- **Icons are generated at runtime** (`electron/assets/icon.ts` writes a PNG with
  `zlib`), so the repository holds no opaque binaries.

### Data location

```text
%APPDATA%/FocusFlow/
├── focusflow.db
├── focusflow.db-wal
└── focusflow.db-shm
```

The database is never written to the install directory.

## Design system

- Tokens live in `src/app/globals.css` as HSL channel triplets; `tailwind.config.ts`
  only maps names to those tokens, so re-theming never touches component code.
- Default accent is `#FF5A5F`, and Settings can switch between Red / Orange /
  Blue / Purple / Green.
- Three neutral surface palettes ship with the app — **Graphite** (the plan's
  greys), **Warm** (paper and ink) and **Cool** (slate). They only override the
  neutral tokens, so the accent stays the user's own choice.
- Light: `#F7F7F5` canvas, `#FFFFFF` surface, `#171717` text, `#E8E8E5` border.
- Dark: `#111111` canvas, `#181818` surface, `#F5F5F5` text, `#292929` border.
- Icons: **Lucide** only. Animation: **Framer Motion** only.

## Keyboard

| Shortcut | Scope | Action |
| --- | --- | --- |
| `Ctrl+Alt+P` | Anywhere | Show or hide FocusFlow |
| `Ctrl+Alt+Space` | Anywhere | Start or pause focus |
| `Ctrl+N` | FocusFlow focused | New task |
| `Ctrl+K` | FocusFlow focused | Command palette |
| `Ctrl+Shift+F` | FocusFlow focused | Focus mode |
| `Esc` | Focus mode | Leave focus mode |

The `Ctrl+Alt+…` pairs are registered system-wide; the others stay local so they
do not break other applications. Conflicts are reported in Settings.

## Quick add

The quick add field (and the command palette) understands a small, predictable
slice of natural language. Anything it does not recognise stays in the title, so
a failed parse can never block creating a task.

| Input | Result |
| --- | --- |
| `Finish homework tomorrow` | due tomorrow |
| `Practice piano !high #Music ~2` | high priority, project Music, 2 estimated pomodoros |
| `Draft the report 3 pomodoros` | estimate spelled out |
| `Trip next friday` | the friday of next week |
| `Call mum in 2 weeks` / `in 3 days` | relative offset |
| `Submit by 2026-03-20` | an explicit date |
| `Read chapter 3 !!` | `!!!` high, `!!` medium, `!` low |

## Updates

FocusFlow checks for a newer release only when asked: **Settings → Updates →
Check now**, or the opt-in "Check for updates on launch" switch (off by default,
so the app makes no network call until you say so). A newer version opens its
GitHub release page — there is no downloader and no silent install.

## Definition of Done

Every phase is checked against plan.md §35:

- [x] Feature works end to end
- [x] TypeScript strict mode, no `any`, no unused imports
- [x] Dark mode for every screen
- [x] Keyboard navigation and visible focus states
- [x] Loading, empty and error states on every list
- [x] UI consistent with the design system, no duplicated components
- [x] Local-first: the only network call is the opt-in update check

Run before committing:

```bash
npm run typecheck
npm run lint
npm test
npm run build:app
```

CI (`.github/workflows/ci.yml`) runs the same four on every push and pull
request; `release.yml` builds the installers when a `v*` tag is pushed.

## Status

| Phase | |
| --- | --- |
| 0 — Project setup | ✅ Next.js 16 (static export) + Electron 44 + TypeScript strict |
| 1 — Design system | ✅ Tokens, typography, shadcn/ui primitives, light + dark |
| 2 — App shell | ✅ Window chrome, sidebar, header, theme, settings, page transitions |
| 3 — Todo | ✅ CRUD, Today / Inbox / Upcoming, projects, quick add with parsing |
| 4 — Timer | ✅ Drift-free engine, task × pomodoro, focus mode |
| 5 — Integration | ✅ Sessions recorded, task counts, notifications, sounds |
| 6 — Windows | ✅ Tray, close-to-tray, global shortcuts, login item |
| 7 — Statistics | ✅ Pomodoros, focus time, completed and created tasks, streaks, project split, weekly chart |
| 8 — Polish | ✅ Command palette, empty/error/loading states, accessibility pass, CSP |
| 9 — Hardening | ✅ Unit + data-layer tests, push/PR CI, arm64 installer, opt-in update check |
| V1.1 (plan.md §37) | ✅ Richer natural-language input, more statistics, sound styles + volume, extra palettes |
