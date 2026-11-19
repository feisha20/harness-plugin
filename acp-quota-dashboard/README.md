# ACP 会员额度仪表盘

[English](README.en.md)

在 DeepSeek Harness 的模型选择器旁显示 Google AI Pro 会员额度。基于开源 ACP 适配器二次开发，适用于使用官方 Antigravity ACP 的个人开发场景。

## 功能

- 模型旁双圈仪表：外圈代表 Gemini 五小时额度，内圈代表周额度。
- 悬停或点击查看紧凑浮层：剩余比例、重置时间、登录邮箱、会员类型和读取时间。
- 手动刷新、短时缓存与并发合并；查询失败保留上次结果，不把未知值显示为零。
- 使用官方 CLI 状态行读取额度，不发送模型请求、不提取 OAuth 凭据、不聚合或自动轮换账号。
- 保留上游 ACP Agent 接入、模型选择和工具交互能力。

## 环境与兼容性

当前版本为 `0.2.2-rc.5.1+quota.4.21`，包名为 `@feisha20/dsh-acp-adapter`。Antigravity 额度读取支持 macOS／Linux，使用 Python3 和官方 Antigravity CLI。

构建及运行目标均固定为 DSH `0.2.2-rc.5`（DSH NEXT `2.0.24-next` 内置版本），需要 Node.js `>=24.9.0`。

通过 DSH 原生入口管理团队与子 Agent。可在插件设置中连接 Antigravity、Codex、Devin 和 Claude 等 Agent，随后从宿主模型选择器选择。CLI 宿主包名为 `@deepseek-ai/dsh`。

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

更多开发、数据来源、权限及回退说明见 [会员额度二次开发](https://github.com/feisha20/harness-plugin/blob/main/acp-quota-dashboard/docs/会员额度二次开发.md)。

## 上游与许可

本仓库独立维护完整源码，当前基线为上游 [`v0.2.2-rc.5.1`](https://github.com/zaimokuza-yoshiteru/dsh-acp-adapter/releases/tag/v0.2.2-rc.5.1)（`2aaabb9426b14ba67fe1b76495fdfe4145b464d2`）。直接使用本目录构建，本地包只依赖 DSH 宿主与声明的 SDK。

使用 MIT 许可，原始版权声明见 [LICENSE](LICENSE)。`private: true` 保持本地打包发行。升级旧定制包时，迁移桌面 profile 的包引用，保留 `dsh-acp-adapter` 设置 ID、`acp-*` 模型路由及 `dsh-acp` 会话存储。两个包共用这些宿主标识，安装时只启用一个。
