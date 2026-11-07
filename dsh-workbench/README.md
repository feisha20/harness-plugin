# DeepSeek Harness 个人工作台插件 (`@mywork/dsh-workbench`)

原生集成至 **DeepSeek Harness (DSH)** 左侧主导航栏的个人工作台插件，具备多通道会话采集、事项看板管理、工作日报增量整理、周报/月报自动归档等全流程功能。

---

## 🌟 核心功能

### 1. 🔌 多通道会话采集源 (Data Sources)
- **DeepSeek Harness 本机会话**：自动扫描本端会话历史与转录日志（`brain/*/transcript.jsonl`），提取会话关键目标与完成动作。
- **Claude Code 会话**：监听并解析本机 Claude Code 日志（`~/.claude`）。
- **Codex CLI 历史**：适配并采样本机 Codex 历史任务（`~/.codex`）。
- **Gemini CLI 会话**：接入 Gemini CLI 历史会话快照（`~/.gemini`）。
- **禅道 Zentao**：支持配置禅道系统地址、账号与 API 凭据，自动同步指派给本人的待办与 Bug 缺陷。
- **采集诊断与状态**：各渠道具备独立的可用性探测、就绪指示、会话统计与一键增量同步能力。

### 2. 📋 事项待办看板 (Tasks Kanban)
- **三态流转**：待办（Pending）、进行中（In Progress）、已完成（Completed）。
- **多维度筛选**：支持关键词搜索、按来源渠道过滤、按执行状态快速切换。
- **事项详情与元数据**：优先级（高/中/低）、置顶（Pin）、截止时间、归属工程项目路径。
- **采信证据溯源**：AI 自动抽取的事项保留原始会话消息、时间戳与原话引用（Quote）。
- **手工待办**：支持随时随地快捷新增日常研发待办。

### 3. 📅 工作日报 (Daily Report)
- **自动归集算法**：智能拉取指定日期内完成的事项与进行中的主线任务，按项目自动分组归类。
- **快速日期定位**：提供今日、昨日、前天快捷跳转及日历日期选择器。
- **双模查看与编辑**：结构化事项卡片与 Markdown 文本预览，支持随时手工微调。
- **一键复制**：提供“复制标准日报”快捷操作，一键生成符合企微、钉钉、Slack 规范的工作简报。
- **历史归档**：修改与保存自动持久化存储至本地仓库。

### 4. 📊 周报与月报 (Weekly & Monthly Reports)
- **智能周期边界计算**：
  - **周报**：按 ISO 标准周（周一至周日）聚合当周完成事项与推进中任务。
  - **月报**：按自然月度统计里程碑产出与阶段性交付。
- **三段式标准结构**：
  1. **核心工作产出与交付**（已达成成果）
  2. **重点攻坚与推进中事项**（在手重点工作）
  3. **下周期规划与风险预警**（后续排期与攻关点）
- **度量统计卡片**：自动统计周期完成事项总数、攻坚事项数、涉及工程项目数、活跃记录天数。
- **支持手工微调、归档保存与一键复制**。

### 5. 💾 本地持久化 (Zero-Config Persistence)
- 数据持久化存储于用户主目录 `~/.dsh-workbench/workbench-store.json`。
- 基于临时文件与原子重命名写入，保障并发与崩溃安全。
- 零外部数据库依赖，无需启动 Docker 或 PostgreSQL，即装即用。

---

## 🏗️ 技术架构

本插件遵循 DeepSeek Harness 原生的 **Cordis 插件规范** 与 **Slots 插槽架构**：

```
DeepSeek Harness 宿主
  ├── 左侧导航栏: @deepseek-ai/dsh-client-ui-sidebar
  │     └── 插槽 'sidebar.panellist' -> 注册 WorkbenchIcon (id: 'workbench', order: 15)
  ├── 中央工作区: @deepseek-ai/dsh-client-ui-layout
  │     └── 插槽 'main' -> 注册 WorkbenchApp (key: 'workbench')
  └── 宿主 HTTP 服务: @deepseek-ai/dsh-host-webserver
        └── 注册 '/api/workbench/*' 具名前缀路由 -> 驱动 Store、Collector 与 ReportEngine
```

---

## 🛠️ 构建与打包

进入插件目录：

```bash
cd dsh-workbench

# 1. 编译 Host 端 TypeScript 与声明文件
npm run build:host

# 2. 通过 tsdown 打包客户端 Bundle (含 DSH __ModuleLoader__ 包裹层)
npm run build:client

# 3. 完整构建并打包为发布安装包 (.tgz)
npm run pack
```

打包产物位于 `dist/mywork-dsh-workbench-0.1.0.tgz`。

---

## 🚀 安装至 DeepSeek Harness

### 方式一：通过 Harness 界面安装（推荐）
1. 打开 DeepSeek Harness 桌面端 / Web 端。
2. 点击左侧主菜单的 **插件**（Plugins）图标。
3. 选择 **从本地文件安装**（Install from file...），选中 `dist/mywork-dsh-workbench-0.1.0.tgz`。
4. 重启或刷新页面，左侧主菜单将出现 **工作日志** 入口。

### 方式二：通过 DSH 命令行添加
```bash
dsh plugin add ./dist/mywork-dsh-workbench-0.1.0.tgz
```
