# Langfuse Trace 看板 (`@local/langfuse-dashboard`)

DeepSeek Harness 插件，提供多环境 Langfuse 密钥配置与便捷的 Trace / Session 可视化排查看板。

## 功能特性

- **多环境密钥管理**：支持配置多个 Langfuse 环境（如测试环境、生产环境），自动调用 `/api/public/projects` 验证连通性并识别 `projectId` 与项目名称。密钥通过 Harness `credentials` 服务（或本机 `.local/`）安全持久化，不写入仓库代码。
- **极速检索**：支持按 `Run ID`、`Session ID`、`Trace ID` 查询，或使用「自动识别」一键定位；支持时间范围筛选、历史查询记录与「拉取最近 Trace」。
- **以排查者为中心的可读化视图**：
  - **对话与执行流**：自动折叠冗长的 System Prompt 与 Tool Schema，提取用户输入、模型思考/输出、工具调用入参/出参及最终回复；默认隐藏 `format unknown` 等噪声 Span。
  - **调用树 & 耗时瀑布图**：按父子关系还原完整调用树与耗时占比条，异常节点红标提示，点击任意节点查看格式化载荷与原始 JSON。
  - **Session 多轮聚合**：按 `Session ID` 查询时自动按 Trace 分组并区分主对话轮次与 `Followup` 等旁路调用。
  - **一键跳转与导出**：支持一键复制 `run_id` / `sessionId` / Markdown 排障摘要，或直接跳转至 Langfuse 原生页面对应 Trace。
- **Agent 工具联动**：注册只读工具 `langfuse_query_trace`，支持在对话中按 `run_id` / `session_id` / `trace_id` 直接检索已配置环境的 Trace 摘要。
