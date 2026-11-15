# @local/colab-media-studio (Colab 影像工坊)

在 DeepSeek Harness 左侧导航栏新增 **Colab 影像工坊** 面板，直连运行在 **Google Colab Ultra**（A100 / L4 GPU）上的 **ComfyUI**，提供文生图、图生图、文生视频、图生视频、一键部署 `.ipynb` 向导与本地作品库自动归档。

## 核心能力

- **左侧菜单入口**：注册于 `sidebar.panellist`（`id: 'colab-media-studio'`）和 `main`（`key: 'colab-media-studio'`）。
- **图片生成**：
  - 支持文生图、图生图（内置参考图上传与重绘幅度调节）。
  - 支持标准/FLUX 单文件 Checkpoint（如 `flux1-schnell-fp8.safetensors`）、FLUX 分离式加载（UNET + DualCLIP + VAE）以及自定义 ComfyUI `Save (API Format)` 工作流 JSON。
  - 生成图片支持一键「以此图生成视频」，直接带入视频页作为首帧。
- **视频生成**：
  - 支持文生视频、图生视频（首帧驱动）。
  - 内置 **Wan 2.1 / 2.2**、**LTX-Video** 与自定义 API 工作流，自动对齐 `4k+1` 帧数与 `16` 倍数分辨率。
  - 自动探测 ComfyUI 节点能力，优先使用 `VHS_VideoCombine` (MP4)，回退到 `SaveWEBM` / `SaveAnimatedWEBP`。
- **Colab Ultra 一键部署向导**：
  - 生成并下载 `colab-comfyui-ultra.ipynb`，预置 Google Drive 模型持久化软链接、`ComfyUI-Manager`、`ComfyUI-VideoHelperSuite`、`cloudflared` 公网穿透以及实测可用的 HuggingFace `Comfy-Org` 模型下载链接。
- **Agent 工具联动**：提供 `colab_comfy_studio` 工具，可在对话中直接让 AI 帮你检查连接、生成图片/视频或导出 Notebook。
