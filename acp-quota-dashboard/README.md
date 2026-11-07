# ACP 会员额度仪表盘

在 DeepSeek Harness 的模型选择器旁显示 Google AI Pro 会员额度。基于开源 ACP 适配器二次开发，适用于使用官方 Antigravity ACP 的个人开发场景。

## 功能

- 模型旁双圈仪表：外圈代表 Gemini 五小时额度，内圈代表周额度。
- 悬停或点击查看紧凑浮层：剩余比例、重置时间、登录邮箱、会员类型和读取时间。
- 手动刷新、短时缓存与并发合并；查询失败保留上次结果，不把未知值显示为零。
- 使用官方 CLI 状态行读取额度，不发送模型请求、不提取 OAuth 凭据、不聚合或自动轮换账号。
- 保留上游 ACP Agent 接入、模型选择和工具交互能力。

## 环境与兼容性

当前版本：`0.2.1-rc.4.1+quota.4`。需要 macOS／Linux、Python3 和已登录的官方 Antigravity CLI，当前实测 CLI 为 `1.5.2`。

上游插件声明的 Harness 目标为 `0.2.1-rc.4`；本地在 Desktop `0.2.2-rc.1` 上使用精确版本例外验证安装、对话和额度展示。该结果不代表所有版本与平台均兼容。

本插件独立安装在用户 profile，不修改 Harness Desktop 应用文件或更新机制。桌面端升级后需重新核对插件兼容性，精确版本例外不会自动继承。

## 开发与打包

从本目录执行：

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm exec vitest run test/quota.spec.ts test/quota-cache.spec.ts
corepack pnpm build
mkdir -p dist
npm pack --ignore-scripts --pack-destination dist
```

Node.js 开发固定版本见 `.nvmrc`，包管理器版本见 `package.json`。构建后 `dist/` 中的 tgz 可在 Harness 插件管理器中通过本地文件安装；安装前退出桌面应用，安装后重启。

安装后配置 Antigravity：可执行命令填写本机 `agy` 的绝对路径，参数填写 `acp`。选择对应 Gemini 模型即可看到额度仪表。账号来源为官方 CLI 当前登录账号。

更多开发、数据来源、权限及回退说明见 [会员额度二次开发](docs/会员额度二次开发.md)。

## 上游与许可

本插件不是从零实现：基于 [zaimokuza-yoshiteru/dsh-acp-adapter](https://github.com/zaimokuza-yoshiteru/dsh-acp-adapter)，基准提交 `28ccc6745ec82139c684c3642637e93e00d800f2`。原有 ACP 适配逻辑与历史文档保留，上游 README 见 [上游说明](docs/上游说明.md)。

使用 MIT 许可，原始版权声明见 [LICENSE](LICENSE)。保留内部包名 `@zaimokuza/dsh-acp-adapter`，以兼容现有模块、配置及历史会话；`private: true` 用于防止误发布到上游同名 npm 包，不影响本地 tgz 打包和安装。
