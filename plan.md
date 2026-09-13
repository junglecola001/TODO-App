# FocusFlow — Windows 番茄钟 + Todo 开发计划

> 本文档是供 AI Coding Agent 执行的项目级开发计划。  
> 项目名称：**FocusFlow**  
> 平台：**Windows 优先**  
> 产品形态：**桌面应用**  
> 核心定位：**漂亮、快速、低干扰的 Todo + Pomodoro 专注工具**

---

## 1. 产品目标

FocusFlow 是一个现代化的 Windows Todo + Pomodoro 应用。

核心体验：

```text
选择任务
  ↓
开始 Focus
  ↓
专注计时
  ↓
完成番茄钟
  ↓
任务获得专注记录
  ↓
完成任务
  ↓
查看统计
```

产品设计目标：

> 打开 FocusFlow 后，用户应该立刻知道「现在该做什么」，并且愿意开始工作。

不要做成传统的 Windows 工具软件。视觉方向参考：

- Arc
- Linear
- Things
- Raycast
- Windows 11 Fluent Design

关键词：

**Minimal / Elegant / Calm / Premium / Fluid / Focused**

---

# 2. 技术栈

## Frontend / UI

必须使用：

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Framer Motion
- Lucide Icons

推荐：

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui 作为基础组件体系
- Radix UI 负责 accessible primitives
- Framer Motion 负责动画
- Lucide React 负责图标

## Desktop

使用：

**Electron**

结构：

```text
Next.js
    ↓
React UI
    ↓
Electron Renderer
    ↓
Electron Main Process
    ↓
SQLite
```

Next.js 主要负责 UI 层，不依赖远程服务器才能运行。

生产环境必须支持离线运行。

---

# 3. 为什么使用 Next.js + Electron

虽然 FocusFlow 是 Windows 桌面软件，但使用 Next.js 可以获得：

- React App Router
- 良好的项目结构
- Server/Client Component 边界
- 成熟的 React 生态
- 易于未来扩展 Web/PWA 版本

Electron 负责：

- Windows 窗口
- System Tray
- Windows Notifications
- Global Shortcut
- 开机启动
- 本地数据库
- 文件系统
- IPC

重要：

**不要让 Renderer 直接访问 Node.js API。**

必须通过 Electron IPC 暴露有限且明确的 API。

---

# 4. 项目目录

```text
focusflow/
│
├── agents/
│   └── plan.md
│
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── tray.ts
│   ├── notifications.ts
│   ├── shortcuts.ts
│   ├── window.ts
│   └── ipc/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── today/
│   │   ├── inbox/
│   │   ├── upcoming/
│   │   ├── projects/
│   │   ├── statistics/
│   │   └── settings/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── task/
│   │   ├── timer/
│   │   ├── project/
│   │   ├── statistics/
│   │   └── command-palette/
│   │
│   ├── stores/
│   │   ├── task-store.ts
│   │   ├── timer-store.ts
│   │   ├── project-store.ts
│   │   └── settings-store.ts
│   │
│   ├── lib/
│   │   ├── ipc.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── types/
│
├── drizzle/
│   └── schema.ts
│
├── public/
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

如果实际构建工具需要调整目录，只允许在不破坏上述架构原则的情况下调整。

---

# 5. UI 总体布局

主窗口：

```text
┌──────────────────────────────────────────────────────┐
│  FocusFlow                              ⌕  ⚙  — □ × │
├────────────────┬─────────────────────────────────────┤
│                │                                     │
│  Today         │          Good afternoon.            │
│  Inbox         │                                     │
│  Upcoming      │          Focus                       │
│                │                                     │
│  ──────────    │             24:37                   │
│                │                                     │
│  Projects      │          Finish homework             │
│  ○ School      │                                     │
│  ○ Music       │          [ Pause ]                  │
│  ○ Personal    │                                     │
│                │                                     │
│  ──────────    │          Today's Tasks              │
│  Statistics    │          ○ Finish homework           │
│  Settings      │          ○ Practice piano            │
│                │          ○ Study music theory        │
└────────────────┴─────────────────────────────────────┘
```

Sidebar：

- Today
- Inbox
- Upcoming
- Projects
- Statistics
- Settings

主内容区域：

- Dashboard
- Todo
- Focus Timer

---

# 6. UI 设计规范

这是项目最高优先级之一。

## 6.1 原则

必须：

- 简洁
- 留白充足
- 层级清晰
- 视觉稳定
- 微妙动画
- 高质量 typography
- 完整 Dark Mode
- 键盘可操作

禁止：

- 大量渐变
- 过度玻璃拟态
- 巨大阴影
- 五颜六色的卡片
- 廉价的 neumorphism
- 默认浏览器样式
- 到处都是圆角卡片
- 不必要的动画
- emoji 作为主要 UI 图标

## 6.2 图标

统一使用：

**Lucide Icons**

禁止：

- Font Awesome
- 随机 SVG 图标
- emoji 代替 UI icon

## 6.3 Components

基础组件优先使用：

**shadcn/ui + Radix UI**

例如：

- Button
- Dialog
- DropdownMenu
- Tooltip
- Popover
- Command
- Checkbox
- Select
- ContextMenu
- Toast/Sonner

不要为了一个简单组件引入新的 UI Framework。

---

# 7. 配色

默认 Light：

```text
Background  #F7F7F5
Surface     #FFFFFF
Text        #171717
Secondary   #737373
Border      #E8E8E5
```

默认 Dark：

```text
Background  #111111
Surface     #181818
Text        #F5F5F5
Secondary   #888888
Border      #292929
```

Accent 默认：

```text
#FF5A5F
```

但用户可以修改 Accent：

- Red
- Orange
- Blue
- Purple
- Green

不要让 Accent Color 污染整个界面。

---

# 8. Todo 系统

Task 数据：

```text
id
title
description
completed
priority
dueDate
projectId
createdAt
completedAt
estimatedPomodoros
actualPomodoros
```

Priority：

```text
None
Low
Medium
High
```

Date：

```text
Today
Tomorrow
This weekend
Next week
Custom
```

Todo 必须支持：

- 创建
- 编辑
- 完成
- 取消完成
- 删除
- 优先级
- 截止日期
- Project
- Pomodoro 数量

---

# 9. Quick Add

快捷键：

```text
Ctrl + N
```

弹出快速添加窗口。

```text
┌──────────────────────────────────────┐
│ Add task                             │
│                                      │
│ Finish math homework                 │
│                                      │
│ Today · Medium                       │
│                                      │
│                         Add          │
└──────────────────────────────────────┘
```

第一版支持简单自然语言解析：

```text
Finish homework tomorrow
```

解析：

```text
title = Finish homework
dueDate = tomorrow
```

如果解析失败，不应该阻止用户创建任务。

---

# 10. Pomodoro

默认：

```text
Focus       25 min
Short Break 5 min
Long Break  15 min
```

默认每：

```text
4 Focus sessions
```

进入 Long Break。

支持：

- Start
- Pause
- Resume
- Reset
- Skip
- Focus
- Short Break
- Long Break

Timer 必须使用可靠的时间计算。

**不要仅依赖 setInterval 每秒 +1/-1。**

应该记录：

```text
startedAt
pausedAt
remainingDuration
```

并根据真实时间重新计算剩余时间，避免后台运行时漂移。

---

# 11. Task × Pomodoro

这是 FocusFlow 的核心功能。

用户选择：

```text
Finish homework
```

点击：

```text
Start Focus
```

Timer 显示：

```text
24:37

Finish homework
```

Pomodoro 完成：

```text
🍅 Focus completed
```

Task：

```text
Finish homework

Pomodoros
● ● ●
3 completed
```

数据库记录每一个 Pomodoro Session。

---

# 12. Focus Mode

快捷键：

```text
Ctrl + Shift + F
```

进入 Focus Mode。

隐藏：

- Sidebar
- 其他任务
- Statistics
- Settings
- 多余按钮

只显示：

```text
                 24:37

            Finish homework

                  Pause

             FocusFlow
```

动画平滑。

退出 Focus Mode 后恢复之前页面状态。

---

# 13. Statistics

Statistics 页面：

```text
This Week

17
Pomodoros

12h 35m
Focus Time

43
Completed Tasks

31m
Average Focus
```

显示：

- 每日 Pomodoro
- 每日 Focus Time
- 完成任务
- 平均 Focus 时长
- Streak

图表必须简洁。

不要制作复杂 Dashboard。

---

# 14. Streak

例如：

```text
🔥 7 day streak
```

只作为轻量反馈。

不要做成游戏化系统。

---

# 15. Projects

默认：

```text
School
Music
Personal
```

用户可以：

- 创建 Project
- 删除 Project
- 修改名称
- 修改 icon
- 修改 accent color

Project 页面：

```text
Music

12 tasks
7 completed

████████░░ 70%
```

---

# 16. Windows 集成

## System Tray

关闭窗口后默认：

**隐藏到 Tray，而不是直接退出。**

Tray：

```text
FocusFlow

Start Focus
Pause
Resume

Today's Tasks

Open FocusFlow
Quit
```

---

## Windows Notification

Focus 完成：

```text
Focus complete

Great work.
Time for a break.
```

Break 完成：

```text
Break finished

Ready for another focus?
```

允许用户在 Settings 关闭通知。

---

# 17. Global Shortcuts

```text
Ctrl + Alt + P
Open FocusFlow

Ctrl + Alt + Space
Start / Pause Focus

Ctrl + N
New Task

Ctrl + Shift + F
Focus Mode

Ctrl + K
Command Palette
```

快捷键必须可以在 Settings 中查看。

如果发生快捷键冲突，应给用户明确提示。

---

# 18. Command Palette

使用 shadcn/ui Command / Radix 体系。

快捷键：

```text
Ctrl + K
```

界面：

```text
┌─────────────────────────────────────┐
│ Search commands...                  │
├─────────────────────────────────────┤
│ Start Focus                         │
│ Add Task                            │
│ Complete Current Task               │
│ Open Today                          │
│ Open Statistics                     │
│ Enter Focus Mode                    │
│ Open Settings                       │
└─────────────────────────────────────┘
```

支持：

- 搜索命令
- 搜索 Task
- 页面导航
- Timer 操作

---

# 19. 动画

使用：

**Framer Motion**

动画应该：

- 快
- 柔和
- 不打扰工作

Task 完成：

```text
Checkbox
→ scale 1.0 → 1.1 → 1.0
→ strike-through
→ opacity slightly reduced
```

页面切换：

```text
opacity
+
translateY(4px)
```

Dialog：

```text
opacity
+
scale(0.98 → 1)
```

禁止：

- 大幅旋转
- 大幅缩放
- 弹跳
- 无意义粒子效果

---

# 20. 数据库

使用：

**SQLite + Drizzle ORM**

数据库：

```text
tasks
projects
pomodoro_sessions
settings
```

## tasks

```sql
id
title
description
completed
priority
due_date
project_id
estimated_pomodoros
actual_pomodoros
created_at
completed_at
```

## projects

```sql
id
name
icon
color
created_at
```

## pomodoro_sessions

```sql
id
task_id
type
started_at
completed_at
duration
```

type：

```text
focus
short_break
long_break
```

## settings

```sql
key
value
```

---

# 21. 数据位置

Windows：

```text
%APPDATA%/FocusFlow/
```

例如：

```text
FocusFlow/
├── focusflow.db
└── settings.json
```

禁止把用户数据库存放在安装目录。

---

# 22. 状态管理

使用：

**Zustand**

Store：

```text
taskStore
timerStore
projectStore
settingsStore
```

UI 不应该直接操作数据库。

正确结构：

```text
Component
   ↓
Zustand
   ↓
IPC API
   ↓
Electron Main
   ↓
Repository
   ↓
SQLite
```

---

# 23. Electron 安全

必须：

```text
contextIsolation: true
nodeIntegration: false
sandbox: true
```

Renderer 不允许：

```text
require()
fs
child_process
process APIs
```

所有系统操作通过 preload 暴露的最小 API 完成。

不要暴露整个 ipcRenderer。

---

# 24. Offline First

FocusFlow 必须：

- 无网络可用
- Todo 本地保存
- Timer 无网络可用
- Statistics 无网络可用

未来如果增加云同步：

```text
SQLite
    ↕
Sync Layer
    ↕
Cloud Database
```

云同步不能破坏本地优先架构。

---

# 25. Settings

Settings：

```text
Appearance
├── Light
├── Dark
└── System

Accent Color

Timer
├── Focus Duration
├── Short Break
├── Long Break
└── Long Break Interval

Notifications
├── Focus Complete
├── Break Complete
└── Sound

Behavior
├── Start on Windows startup
├── Close to tray
└── Auto start next session
```

---

# 26. 音效

提供非常轻的声音：

```text
Timer Start
Timer Complete
Break Complete
Task Complete
```

风格：

- soft bell
- subtle click
- gentle chime

必须支持：

```text
Sound ON/OFF
```

---

# 27. 响应式布局

虽然主要针对 Windows Desktop，但 UI 必须适应：

```text
1280×720
1366×768
1920×1080
2560×1440
3840×2160
```

窗口缩小时：

1. 减少 Sidebar 宽度
2. 隐藏次要文字
3. 调整内容间距
4. 保证核心 Timer 和 Task 可用

禁止出现横向滚动条。

---

# 28. Accessibility

必须支持：

- Keyboard navigation
- Focus states
- aria-label
- Tooltip
- Screen reader 基本支持
- 足够的文本对比度

不要为了视觉效果删除 focus outline。

---

# 29. Empty States

所有列表都需要漂亮的 Empty State。

例如 Today 没有任务：

```text
              ✦

        Nothing planned.

        Enjoy your day.
```

不要简单写：

```text
No data.
```

---

# 30. Error States

错误必须用户可理解。

错误：

```text
Unable to save task.
```

而不是：

```text
SQLiteError: SQLITE_BUSY...
```

开发环境 console 可以保留详细错误。

---

# 31. 开发阶段

## Phase 0 — Project Setup

完成：

- Electron
- Next.js
- React
- TypeScript
- Tailwind
- shadcn/ui
- Radix
- Framer Motion
- Lucide
- Zustand
- Drizzle
- SQLite

确认：

```text
npm run dev
```

可以正常打开桌面窗口。

---

## Phase 1 — Design System

建立：

- Color tokens
- Typography
- Spacing
- Radius
- Shadows
- Button
- Input
- Dialog
- Tooltip
- Dropdown
- Checkbox
- Command

先完成 UI 基础。

---

## Phase 2 — App Shell

完成：

- Window
- Sidebar
- Navigation
- Header
- Theme
- Settings
- Page transition

---

## Phase 3 — Todo

完成：

- Task CRUD
- Today
- Inbox
- Upcoming
- Priority
- Due Date
- Projects

---

## Phase 4 — Timer

完成：

- Focus
- Short Break
- Long Break
- Start
- Pause
- Resume
- Reset
- Skip

---

## Phase 5 — Integration

完成：

```text
Task
↓
Start Focus
↓
Pomodoro
↓
Save Session
↓
Update Task
```

---

## Phase 6 — Windows

完成：

- Tray
- Notification
- Global Shortcut
- Startup
- Close to Tray

---

## Phase 7 — Statistics

完成：

- Pomodoro statistics
- Focus time
- Completed tasks
- Streak
- Weekly chart

---

## Phase 8 — Polish

重点：

- Animation
- Dark Mode
- Typography
- Spacing
- Hover
- Active state
- Empty state
- Error state
- Keyboard interaction
- Performance

**这一阶段不得为了增加功能而牺牲 UI 打磨。**

---

# 32. Git 工作流

分支：

```text
main
develop
feature/*
fix/*
```

例如：

```text
feature/todo
feature/pomodoro
feature/statistics
feature/windows-tray
```

Commit：

```text
feat: add todo creation
feat: add pomodoro timer
fix: prevent timer drift
style: improve task list spacing
refactor: extract timer service
```

不要使用：

```text
update
aaa
test
final
final2
```

---

# 33. AI Agent 工作规则

Agent 必须遵守：

1. TypeScript strict mode。
2. 禁止 `any`，除非有明确技术理由并添加注释。
3. React Component 保持单一职责。
4. UI 与数据访问分离。
5. 数据库操作必须经过 Repository。
6. Renderer 不允许直接访问 Node.js。
7. 所有 Electron 系统 API 通过 preload IPC。
8. Zustand 管理客户端状态。
9. shadcn/ui + Radix 作为基础 UI。
10. Framer Motion 作为唯一主要动画库。
11. Lucide 作为统一图标库。
12. 不允许随意添加新的 UI framework。
13. 新功能必须支持 Dark Mode。
14. 新功能必须考虑 Keyboard Navigation。
15. 不要破坏已有功能来实现新功能。
16. 修改前先理解现有代码。
17. 优先复用已有组件。
18. 不要重复创建相同功能的组件。
19. 不要为了“看起来完成”而写假数据。
20. 所有异步操作必须处理 loading / error 状态。
21. 所有数据库操作必须考虑异常。
22. Timer 必须基于真实时间计算，不能依赖简单 interval 累减。
23. 用户数据必须默认本地保存。
24. 不需要网络时不要发网络请求。
25. UI 必须保持 Premium / Minimal / Calm 的设计方向。

---

# 34. AI Agent 执行流程

每次接收任务：

```text
1. 阅读 agents/plan.md
2. 检查当前项目结构
3. 检查已有组件
4. 检查已有 Store
5. 检查数据库 Schema
6. 制定最小修改方案
7. 实现
8. 类型检查
9. Lint
10. Build
11. 修复错误
12. 汇报修改内容
```

禁止：

```text
收到任务
↓
直接重写整个项目
```

---

# 35. Definition of Done

一个功能只有满足以下条件才算完成：

```text
[ ] 功能正常
[ ] TypeScript 无错误
[ ] Build 成功
[ ] 无明显 Console Error
[ ] Dark Mode 正常
[ ] Keyboard Navigation 正常
[ ] Loading 状态正常
[ ] Error 状态正常
[ ] Empty State 正常
[ ] UI 与设计系统一致
[ ] 无重复组件
[ ] 无明显性能问题
```

---

# 36. MVP 必须包含

第一版不要加入过多功能。

必须：

```text
✓ Todo
✓ Today
✓ Inbox
✓ Projects
✓ Pomodoro
✓ Task × Pomodoro
✓ Focus Mode
✓ Statistics
✓ Dark Mode
✓ Windows Tray
✓ Windows Notification
✓ Global Shortcut
✓ Command Palette
✓ Local SQLite
```

暂时不要：

```text
✗ 用户系统
✗ 云同步
✗ 社交
✗ AI 自动规划
✗ 在线协作
✗ 手机 App
✗ 复杂日历
✗ 插件系统
```

这些属于后续版本。

---

# 37. Future Roadmap

V1.1：

- Better natural language task input
- More statistics
- Custom sounds
- More themes

V1.2：

- Cloud Sync
- Account
- Backup / Restore

V2：

- macOS
- Linux
- Web/PWA
- Mobile companion

---

# 38. 最终产品标准

FocusFlow 最终应该给人的感觉：

> 「这不是一个普通的番茄钟，而是一个我愿意每天打开的工作空间。」

打开软件：

```text
Today
    ↓
选择任务
    ↓
Start Focus
    ↓
专注
    ↓
完成
    ↓
看到进度
    ↓
继续
```

核心原则：

**Less UI, More Focus.**

功能可以少，但每一个功能都必须做到：

**快、漂亮、稳定、无干扰。**
