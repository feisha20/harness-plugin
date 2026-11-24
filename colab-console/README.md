# Colab 算力与模型控制台 (`@local/colab-console`)

DeepSeek Harness（DSH）桌面端/Web 端插件，提供独立控制台面板用于管理：

- **Colab 算力额度**：实时调用 `colab usage` 与 `colab whoami`，展示剩余计算单元（CU）、每小时消耗速率、预计剩余可用时长与活跃实例数。
- **Colab 会话生命周期**：列出当前活跃实例与状态（`IDLE` / `BUSY`），支持新建（CPU / T4 / L4 / G4 / A100 / H100，可选 `--high-mem`）、停止释放与打开 Colab 网页端。
- **一键拉起 Qwen3.8 模型服务（支持按步终止/重试、GPU 自动适配与备选切换）**：无论当前是否有活跃会话，均可一键完成「检查/新建实例（G4 无货/503 时可自动回退至 A100/H100）-> 探测显卡架构并自动适配 `--kv-cache-dtype`（G4/H100 用 `fp8`，A100 自动切换 `auto`；40GB 显存自动调优 `--max-model-len 131072`）-> 自动安装 `vllm` 依赖（若缺失）-> 下载 `sakamakismile/Huihui-Qwen3.8-27B-abliterated-NVFP4` 并启动服务 -> 建立本机 `:8000` 高可用隧道」；执行过程中随时可终止，失败或终止后支持从当前失败步骤或任意步骤一键重试。
- **远端机器与模型服务检测（如 `qwen38` / `vllm`）**：实时读取 GPU 型号、显存占用、GPU 利用率、温度、`vllm` 进程与日志尾部；支持一键启动/重启/关闭远端 `vllm` 服务。
- **本机 SSH 隧道与推理测速**：检测并启停 `127.0.0.1:8000` 到 Colab 的 SSH 端口转发，并支持直接发起流式推理测速（首字延迟 TTFT 与 `tok/s`）。

## 依赖前提

- 本机已安装官方 `google-colab-cli`（`colab` 命令可用）并已完成账号登录。
- 若使用 SSH 隧道或快速远端检测，本机需存在可用 SSH 私钥（默认依次查找 `~/.ssh/id_ed25519`、`~/.ssh/id_ed25519_github`、`~/.ssh/id_ecdsa`、`~/.ssh/id_rsa`）。
