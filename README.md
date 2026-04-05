# Game Nebula

一个基于 Electron + React + TypeScript 的本地游戏启动器。

支持本地游戏导入、收藏管理、记录看板、托盘运行、设置项持久化，以及 Windows 一键打包安装。

## 功能特性
- 界面风格：采用无边线加高斯模糊毛玻璃的设计风格。
- 本地导入：选择 `.exe`、封面图与背景图即可加入库。
- 分类视图：我的 / 收藏 / 记录 三栏导航。
- 游戏详情：展示描述、标签、总时长与会话记录。
- 记录看板：统计总游玩时长、局数、单游戏排行。
- 托盘能力：最小化到托盘、托盘最近游玩快捷启动。
- 性能选项：设置中可切换 GPU 渲染。
- 数据持久化：游戏库与设置保存在本地。

## 技术栈

- Electron 28
- React 19
- TypeScript 5
- Vite 8
- Zustand
- Framer Motion
- electron-builder (NSIS)

## 环境要求

- Node.js 20+
- pnpm 9+
- Windows 10/11（打包 `.exe` 建议在 Windows 环境执行）

## 快速开始

```bash
pnpm install
pnpm dev
```

开发模式会同时启动：

- Vite 渲染进程
- Electron 主进程 TypeScript watch
- Electron 应用

## 常用命令

```bash
# 仅前端开发服务器
pnpm dev:renderer

# 生产构建（renderer + electron）
pnpm build

# 代码检查
pnpm lint

# Windows 安装包（NSIS）
pnpm dist:win
```

## 打包产物

执行 `pnpm dist:win` 后，安装包会输出到 `release/` 目录：

- `Game Nebula Setup x.y.z.exe`
- `Game Nebula Setup x.y.z.exe.blockmap`

## 项目结构

```text
.
├─ assets/                 # 图标与静态资源（如 app.ico）
├─ dist/                   # Vite 构建输出
├─ dist-electron/          # Electron TS 构建输出
├─ release/                # electron-builder 打包产物
├─ src/
│  ├─ main/                # Electron 主进程、IPC、托盘、存储
│  ├─ renderer/            # React 页面、组件、状态管理
│  └─ main.tsx             # 入口
├─ index.html
└─ package.json
```

## 上传 GitHub 前检查清单

- 确认 `package.json` 中 `name`、`version`、`author` 正确。
- 运行 `pnpm lint`，确保无明显静态检查问题。
- 运行 `pnpm dist:win`，确认安装包可正常安装与启动。
- 检查 `.gitignore`，避免提交以下目录：`node_modules/`、`dist/`、`dist-electron/`、`release/`。
- 如要发布开源仓库，补充 `LICENSE` 文件并在 README 标明许可证。
- 如要发布 release，请在 GitHub Releases 上传 `release/` 中的 `.exe`。

## 版本信息

- 应用名：Game Nebula
- 当前版本：0.1.0
- 作者：imSuYuan
