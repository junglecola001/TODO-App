<div align="center">

# FocusFlow

**Windows 上安静而克制的待办 + 番茄工作台**

**少一些界面，多一些专注。**

[![版本](https://img.shields.io/badge/版本-v0.2.0-FF5A5F?style=flat-square)](package.json)
[![许可证](https://img.shields.io/badge/许可证-MIT-3DA639?style=flat-square)](LICENSE)
[![平台](https://img.shields.io/badge/平台-Windows%2010%20%7C%2011-0078D4?style=flat-square&logo=windows11&logoColor=white)](#环境要求)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](#技术栈)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?style=flat-square&logo=electron&logoColor=white)](#技术栈)
[![TypeScript](https://img.shields.io/badge/TypeScript-严格模式-3178C6?style=flat-square&logo=typescript&logoColor=white)](#技术栈)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](#环境要求)

[![CI](https://img.shields.io/github/actions/workflow/status/junglecola001/TODO-App/ci.yml?style=flat-square&label=CI)](.github/workflows/ci.yml)
[![测试](https://img.shields.io/badge/测试-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](#开发脚本)
[![SQLite](https://img.shields.io/badge/存储-SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](#数据存放位置)
[![离线优先](https://img.shields.io/badge/离线优先-%E6%97%A0%E8%B4%A6%E5%8F%B7%20%C2%B7%20%E6%97%A0%E7%BD%91%E7%BB%9C%E8%AF%B7%E6%B1%82-2EA043?style=flat-square)](#亮点设计)
[![设计令牌](https://img.shields.io/badge/设计-令牌化%20%2B%20%E6%9A%97%E8%89%B2%E6%A8%A1%E5%BC%8F-8B5CF6?style=flat-square)](#设计系统)
[![CSP](https://img.shields.io/badge/%E5%AE%89%E5%85%A8-CSP%20%2B%20%E6%B2%99%E7%AE%B1-1F6FEB?style=flat-square)](#亮点设计)

<img src="assets/hero.png" alt="FocusFlow 主界面：左侧是今日任务与项目列表，右侧是番茄钟倒计时与专注模式" width="880" />

</div>

---

FocusFlow 把「待办」和「番茄钟」放进同一个安静的窗口。它**离线优先**：每一条任务、每一个项目和每一次专注记录都保存在本地的 SQLite 里——没有账号，也不联网。

> **少一些界面，多一些专注。**

## ✨ 特性一览

- **任务管理** —— 今天 / 收件箱 / 即将到来三个视图，支持项目分组、优先级、预估番茄数，以及一块能听懂自然语言的快速添加输入框。
- **番茄钟引擎** —— 计时跑在主进程，不靠倒计时累加，而是用 `startedAt + durationMs` 推导剩余时间，窗口收起、系统休眠都不会跑偏。
- **专注模式** —— 进入后只剩当前任务和计时器，按 `Esc` 回到完整界面。
- **统计** —— 番茄数、专注时长、已完成 / 新建任务、连续天数、项目占比与周视图。
- **Windows 深度集成** —— 托盘常驻、关闭到托盘、全局快捷键、开机自启。
- **命令面板** —— `Ctrl+K` 唤出，键盘走遍全应用。
- **通知与音效** —— 阶段结束提醒；提示音由 Web Audio 实时合成，不带任何音频资源。
- **更新检查可选** —— 只提示、不安装；默认关闭，开启前不会发出任何网络请求。

## 📦 环境要求

- **Windows 10 / 11**（主要目标平台）
- **Node.js 22+**（`better-sqlite3` 要求）

运行 FocusFlow **不需要 C++ 工具链**：`better-sqlite3` 自带 `win32-x64` 与 `win32-arm64` 的 N-API 预编译二进制，在 Electron 中可直接加载（`npmRebuild` 已关闭）。不过 `npm install` 仍会隐式触发 `node-gyp rebuild`，这一步需要 Visual Studio 的「使用 C++ 的桌面开发」工作负载。没有它时，用 `npm ci --ignore-scripts` 安装即可，预编译二进制会被直接使用。CI 不受影响——`windows-latest` 自带该工具链。

## 🚀 快速开始

```bash
npm install
npm run dev
```

`npm run dev` 会同时拉起 Next.js 开发服务器和 Electron 外壳。窗口会不断重试直到开发服务器就绪，因此先启动谁都不影响。

如果安装时用了 `--ignore-scripts`，Electron 自身的二进制下载也会被跳过，此时 `npm run dev` 没有运行时可以启动。执行一次 `node node_modules/electron/install.js` 把它取回来即可；该脚本是幂等的，二进制已存在时会立即返回。

## 🛠 技术栈

| 层 | 选型 |
| --- | --- |
| 界面 | React 19 · Next.js 16（静态导出）· Tailwind CSS 3 · shadcn/ui |
| 状态 | Zustand |
| 桌面外壳 | Electron 44 · contextBridge · 自定义 `focusflow://` 协议 |
| 数据 | SQLite（`better-sqlite3`）· Drizzle ORM |
| 动效与图标 | Framer Motion · Lucide |
| 测试与构建 | Vitest · esbuild · electron-builder |

## 📜 开发脚本

| 脚本 | 作用 |
| --- | --- |
| `npm run dev` | Next.js 开发服务器 + Electron 窗口（开发模式） |
| `npm run build` | 将渲染层导出到 `out/`（静态、可离线） |
| `npm run build:electron` | 用 esbuild 把 `electron/` 打包到 `dist-electron/` |
| `npm run build:app` | 依次执行上面两条 |
| `npm run preview` | 先构建，再让 Electron 以打包应用的方式加载 `out/` |
| `npm run dist` | 构建并生成 Windows 安装包到 `release/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint（Next.js + TypeScript 规则） |
| `npm test` | Vitest：单元测试 + 数据层集成测试 |
| `npm run test:watch` | 同一套用例的监听模式 |

## 🏗 架构

```text
组件（Component）
   ↓
Zustand store
   ↓
src/lib/ipc.ts                     （带类型的桥接层）
   ↓
electron/preload.ts                （contextBridge —— 唯一对外暴露的接口）
   ↓
electron/ipc/*                     （ipcMain 处理器）
   ↓
electron/db/repositories/*         （数据访问）
   ↓
SQLite  (%APPDATA%/FocusFlow/focusflow.db)
```

- 渲染层是**静态导出**（`next build` → `out/`）。运行时没有服务器；Electron 通过 `focusflow://` 协议提供这些文件，从而让应用拥有真实且安全的源（因此 `localStorage` 与历史记录都能正常工作）。
- 渲染层**永不**直接触碰 Node.js、文件系统或 SQLite，所有调用都经过一层窄而强类型的 IPC 接口。
- `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。

### 目录结构

```text
electron/
  main.ts             应用生命周期、单实例、装配
  window.ts           无边框窗口、关闭到托盘、导航守卫
  protocol.ts         focusflow:// 处理器，提供 out/（并带上 CSP 头）
  tray.ts             通知区图标、菜单、实时提示
  shortcuts.ts        全局快捷键与冲突上报
  system.ts           Windows 开机自启
  updater.ts          版本检查（GitHub API）—— 只通知，从不安装
  notifications.ts    阶段结束与首次隐藏的通知
  timer/              番茄钟引擎（主进程，基于真实时钟计算）
  db/                 表结构、迁移、仓储
  ipc/                每个功能一个模块；只放处理器，不写 SQL
src/
  app/(shell)/        Today、Inbox、Upcoming、Projects、Statistics、Settings
  components/         ui/(shadcn)、layout/、task/、timer/、project/、statistics/、command-palette/
  stores/             Zustand：tasks、projects、settings、timer、UI
  lib/                IPC 客户端、日期、任务视图、解析器、音效、计时辅助、版本
tests/                Vitest：纯逻辑 + 针对真实 SQLite 文件的数据层测试
assets/               README 展示图，不参与打包
```

### 亮点设计

- **计时器放在主进程。** 窗口收进托盘后它仍在运行，托盘与通知读取同一份状态。它从不做「倒计时累减」：剩余时间由 `startedAt` + `durationMs` 推导，这正是它对节流与休眠免疫的原因。
- **`due_date` 是本地日历日期**（`YYYY-MM-DD`），而非时间戳，所以「今天」不会随时区漂移。统计同样出于这个理由，用 SQLite 的 `localtime` 修饰符转换 epoch 毫秒。
- **强调色在运行时写入 `--primary`**；项目颜色属于数据，保持内联。额外的中性色板（Warm / Cool）只是 `globals.css` 中的普通令牌集合，由 `data-palette` 属性切换。
- **音效由 Web Audio API 合成**，不含音频资源。设置里选择音色族（柔和铃声 / 轻快钟声 / 细腻咔哒 / 极简）与音量，音色表位于 `src/lib/sounds.ts`。
- **更新只提示、从不安装。** `electron/updater.ts` 向 GitHub 查询最新 release，若有更新则给出 release 页面链接。没有下载器，因此应用至今只保留一个运行时依赖（`better-sqlite3`），且除非用户主动要求，不会拉取任何内容。
- **渲染层受 Content-Security-Policy 约束**，该 CSP 随 `focusflow://` 响应一起下发：没有 `eval`，没有远程源，没有插件。
- **图标在运行时生成**（`electron/assets/icon.ts` 用 `zlib` 写出 PNG），因此应用图标不必在仓库中存放二进制文件。仓库里唯一的图片素材是顶部的展示图 `assets/hero.png`，它不参与打包。

### 数据存放位置

```text
%APPDATA%/FocusFlow/
├── focusflow.db
├── focusflow.db-wal
└── focusflow.db-shm
```

数据库永远不会写入安装目录。

## 🎨 设计系统

- 令牌位于 `src/app/globals.css`，以 HSL 通道三元组的形式存在；`tailwind.config.ts` 只负责把名字映射到令牌，因此换主题永远不必改动组件代码。
- 默认强调色是 `#FF5A5F`，设置中可切换红 / 橙 / 蓝 / 紫 / 绿。
- 应用内置三套中性表面色板——**Graphite**（石墨灰）、**Warm**（纸与墨）与 **Cool**（石板）。它们只覆盖中性令牌，所以强调色始终由用户决定。
- 浅色：`#F7F7F5` 画布、`#FFFFFF` 表面、`#171717` 文本、`#E8E8E5` 边框。
- 深色：`#111111` 画布、`#181818` 表面、`#F5F5F5` 文本、`#292929` 边框。
- 图标只用 **Lucide**，动画只用 **Framer Motion**。

## ⌨️ 键盘操作

| 快捷键 | 生效范围 | 行为 |
| --- | --- | --- |
| `Ctrl+Alt+P` | 任意位置 | 显示或隐藏 FocusFlow |
| `Ctrl+Alt+Space` | 任意位置 | 开始或暂停专注 |
| `Ctrl+N` | FocusFlow 窗口内 | 新建任务 |
| `Ctrl+K` | FocusFlow 窗口内 | 命令面板 |
| `Ctrl+Shift+F` | FocusFlow 窗口内 | 专注模式 |
| `Esc` | 专注模式 | 退出专注模式 |

`Ctrl+Alt+…` 组合注册为系统级；其余快捷键只在窗口内生效，以免影响其他应用。冲突情况会在设置中提示。

## ⚡ 快速添加

快速添加输入框（以及命令面板）能理解一小片可预期的自然语言。它不认识的内容会原样留在标题里，因此解析失败绝不会挡住任务的创建。

| 输入 | 结果 |
| --- | --- |
| `Finish homework tomorrow` | 明天到期 |
| `Practice piano !high #Music ~2` | 高优先级、项目 Music、预估 2 个番茄 |
| `Draft the report 3 pomodoros` | 用文字写出预估番茄数 |
| `Trip next friday` | 下周的星期五 |
| `Call mum in 2 weeks` / `in 3 days` | 相对偏移 |
| `Submit by 2026-03-20` | 明确的日期 |
| `Read chapter 3 !!` | `!!!` 高、`!!` 中、`!` 低 |

## 🔄 更新检查

FocusFlow 只在你主动要求时才检查新版本：**设置 → 更新 → 立即检查**，或打开可选开关「启动时检查更新」（默认关闭，因此在你说可以之前，应用不会发起任何网络请求）。发现新版本时会打开对应的 GitHub release 页面——没有下载器，也不会静默安装。

## 📄 许可证

本项目以 **MIT 许可证** 发布，完整文本见 [LICENSE](LICENSE)。

## ✅ 完成标准

每个阶段都对照 plan.md §35 逐项检查：

- [x] 功能端到端可用
- [x] TypeScript 严格模式，无 `any`，无未使用的 import
- [x] 每个界面都支持深色模式
- [x] 键盘可导航，焦点状态可见
- [x] 每个列表都有加载、空态与错误态
- [x] 界面与设计系统一致，不重复造组件
- [x] 本地优先：唯一的网络请求是可选开启的更新检查

提交前请依次运行：

```bash
npm run typecheck
npm run lint
npm test
npm run build:app
```

CI（`.github/workflows/ci.yml`）在每次 push 和 pull request 时执行同样这四项；`release.yml` 则在推送 `v*` 标签时构建安装包。

## 📈 进度

| 阶段 | 状态 |
| --- | --- |
| 0 — 项目搭建 | ✅ Next.js 16（静态导出）+ Electron 44 + TypeScript 严格模式 |
| 1 — 设计系统 | ✅ 令牌、字体排版、shadcn/ui 基础组件、浅色 + 深色 |
| 2 — 应用外壳 | ✅ 窗口边框、侧边栏、顶栏、主题、设置、页面转场 |
| 3 — 待办 | ✅ 增删改查、Today / Inbox / Upcoming、项目、带解析的快速添加 |
| 4 — 计时器 | ✅ 无漂移引擎、任务 × 番茄、专注模式 |
| 5 — 集成 | ✅ 会话记录、任务计数、通知、音效 |
| 6 — Windows | ✅ 托盘、关闭到托盘、全局快捷键、开机自启 |
| 7 — 统计 | ✅ 番茄数、专注时长、已完成与新建任务、连续天数、项目占比、周视图 |
| 8 — 打磨 | ✅ 命令面板、空 / 错误 / 加载态、无障碍检查、CSP |
| 9 — 加固 | ✅ 单元 + 数据层测试、push/PR 的 CI、arm64 安装包、可选的更新检查 |
| V1.1（plan.md §37） | ✅ 更丰富的自然语言输入、更多统计维度、音色与音量、额外色板 |

<div align="center">

**少一些界面，多一些专注。**

</div>


# 感谢 Linux.do 社区
