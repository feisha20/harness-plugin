const PLANS = 'https://one.google.com/intl/en/about/google-ai-plans/?gl=US&hl=en';
const ULTRA = 'https://support.google.com/googleone/answer/16286513?hl=en';
const FLOW = 'https://support.google.com/flow/answer/16526234?hl=en';

export const ULTRA_CATALOG = {
  checkedOn: '2026-11-15',
  plansUrl: PLANS,
  helpUrl: ULTRA,
  groups: [
    { id: 'quota', name: '算力与额度', items: [
      { id: 'colab-cu', name: 'Google Colab', text: '高级加速器、更长的后台运行时间。家庭套餐由管理员使用，试用期不含此项。', limit: 1000, unit: 'CU', cycle: '每月', url: ULTRA },
      { id: 'google-one-storage', name: 'Google One 云存储', text: 'Drive、Gmail 和 Google Photos 共用，支持设备备份和存储管理。', limit: 20, unit: 'TB', cycle: '持续', url: PLANS },
      { id: 'flow-credits', name: 'Google Flow', text: '视频与图像创作、4K 放大。月积分按账单周期刷新，另有每日 50 积分。', limit: 10000, unit: '积分', cycle: '每月', url: FLOW },
      { id: 'flow-music-credits', name: 'Google Flow Music', text: '歌曲、音乐视频和编辑工具，会员包含商用权，另有每日补充积分。', limit: 30000, unit: '积分', cycle: '每月', url: ULTRA },
      { id: 'cloud-credits', name: 'Google Cloud 赠金', text: '关联 Google Developer Profile 并领取开发者权益后获得，按领取日对应的月度周期发放。', limit: 40, unit: 'USD', cycle: '每月', url: 'https://developers.google.com/profile/help/benefits?hl=en' },
      { id: 'extra-ai-credits', name: 'Google One AI 积分', text: 'Flow 或 Antigravity 的基础用量耗尽后，可在支持地区购买额外积分。', value: '按需购买', url: 'https://support.google.com/googleone/answer/16287445?hl=en' },
    ] },
    { id: 'ai', name: 'AI 与办公', items: [
      { id: 'gemini', name: 'Gemini 应用', text: '高级模型、Deep Research、Live、自定义 Gems，以及图像、视频、音乐生成和 Gemini 任务。可在 Gemini 设置查看实时用量。', value: 'Pro 的 5 倍', url: 'https://support.google.com/gemini/answer/16275805?hl=en' },
      { id: 'notebook', name: 'Gemini Notebook', text: '原 NotebookLM，支持语音和视频摘要、测验、报告与幻灯片等。', value: '更高用量', url: PLANS },
      { id: 'workspace', name: 'Gmail、Docs、Vids 等', text: '在 Google 应用内写作、总结和生成内容，包括 Sheets、Slides、Meet、Keep 等支持的功能。', value: '包含', availability: '依功能、语言和地区开放', url: PLANS },
      { id: 'inbox', name: 'AI Inbox', text: '在 Gmail 汇总优先事项与待跟进主题。', value: '包含', availability: '美国、英语', url: ULTRA },
      { id: 'search', name: 'Google 搜索 AI Mode', text: '高级模型、图像生成与编辑。由 AI 向商家询价和确认库存等能力仅在美国开放。', value: '更高用量', url: PLANS },
      { id: 'chrome', name: 'Chrome 自动浏览', text: 'Gemini 在 Chrome 中协助完成网页任务。', value: '更高用量', availability: '美国、印度', url: PLANS },
      { id: 'finance', name: 'Google Finance', text: '通过 Deep Search 深入研究金融信息。', value: '更高用量', availability: '依地区开放', url: PLANS },
      { id: 'earth', name: 'Google Earth', text: '在 Google Earth 中使用 Gemini 分析地理信息。', value: '依账号开放', availability: '美国', url: ULTRA },
      { id: 'hypothesis', name: 'Hypothesis Generation', text: '辅助探索研究问题与生成假设。', value: '依账号开放', url: ULTRA },
    ] },
    { id: 'dev', name: '开发与创作', items: [
      { id: 'antigravity', name: 'Google Antigravity', text: 'Agent 开发平台，享优先流量和新模型访问。摘要比例以基础配额为准。', value: 'Pro 的 5 倍', url: ULTRA },
      { id: 'studio', name: 'Google AI Studio', text: '模型试用、图像生成和 Agent 原型搭建；产品用量与 Gemini API 计费各自管理。', value: '更高用量', url: PLANS },
      { id: 'android', name: 'Gemini in Android Studio', text: '更高的代码补全、推理与 Agent 开发用量。', value: '更高用量', url: PLANS },
      { id: 'developer', name: 'Google Developer Program Premium', text: '包含 Gemini Code Assist、Firebase Studio 30 个工作区等开发者权益。', value: '可领取', url: 'https://developers.google.com/profile/help/faq?hl=en' },
      { id: 'genie', name: 'Project Genie', text: '生成和探索可交互的世界。', value: '可用', availability: '指定国家与地区', url: ULTRA },
      { id: 'playground', name: 'Playground', text: '用 AI 生成、制作和试玩游戏。', value: '更高用量', availability: '美国、18 岁以上', url: ULTRA },
      { id: 'dreambeans', name: 'Dreambeans', text: 'Google 的实验性创作工具。', value: '依账号开放', availability: '美国', url: ULTRA },
    ] },
    { id: 'life', name: '影音与生活', items: [
      { id: 'youtube', name: 'YouTube Premium', text: '个人版，含无广告、离线和后台播放，以及 YouTube Music Premium。', value: '个人版', availability: '指定国家与地区', url: ULTRA },
      { id: 'home', name: 'Google Home Premium', text: '支持的设备可使用全天候录像记录、事件描述和 Gemini 功能。', value: 'Advanced', availability: '依国家、地区和设备开放', url: ULTRA },
      { id: 'health', name: 'Google Health Premium', text: '健康与健身功能，需搭配支持的 Pixel Watch 或 Fitbit 设备。', value: '包含', availability: '指定国家与地区、18 岁以上', url: ULTRA },
      { id: 'photos', name: 'Google Photos AI 创作', text: '照片转视频和 Remix。', value: '更高用量', availability: '依功能和地区开放', url: PLANS },
      { id: 'tv', name: 'Google TV Create Hub', text: '在兼容的 Google TV 设备上使用生成式创作功能。', value: '依账号开放', availability: '美国', url: ULTRA },
      { id: 'google-one', name: 'Google One 会员权益', text: '最多与另外 5 名家庭成员分享存储和部分 AI 权益，也包含高级 Meet 视频通话及 Calendar 预约功能。', value: '包含', url: PLANS },
    ] },
  ],
};
