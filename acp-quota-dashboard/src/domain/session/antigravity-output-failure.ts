/** 只识别 Antigravity 的完整末尾诊断，不把普通 EOF 说明或已恢复的重试判成失败。 */
export function antigravityOutputFailure(text: string): { code: string; message: string } | undefined {
  // 引用或代码块中的诊断不是运行证据。超长输出不做推断，避免截断引用边界。
  if (text.length > 131072) return undefined
  const unquoted = text
    .replace(/```[^]*?(?:```|$)/g, '')
    .replace(/^\s*>.*$/gm, '')
    .trim()
  const auth =
    /(?:^|\n)\s*⚠\uFE0F?\s*UNAUTHENTICATED \(code 401\): Request had invalid authentication credentials\.[^\n]*(?:\n\s*)?$/
  const transport =
    /(?:^|\n)\s*⚠\uFE0F?\s*API error \(attempt \d+\): request failed: Post "https:\/\/daily-cloudcode-pa\.googleapis\.com\/[^"\s]+":\s*EOF\s*$/
  if (auth.test(unquoted))
    return {
      code: 'ACP_UPSTREAM_AUTH_FAILED',
      message:
        'Antigravity 上报认证失败（401），本轮结果未确认。请先检查 Agent 登录状态，再手动继续；不会自动重放任务。',
    }
  if (transport.test(unquoted))
    return {
      code: 'ACP_UPSTREAM_REQUEST_FAILED',
      message:
        'Antigravity 请求在重试后仍以 EOF 错误结束，本轮结果未确认。请查看原始错误并检查连接，再手动继续；不会自动重放任务。',
    }
  return undefined
}
