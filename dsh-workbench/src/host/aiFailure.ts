import type { FinishReason, TokenUsage } from '@deepseek-ai/dsh-llm'

/** 错误信息用于界面诊断，不包含提示词、正文或凭据。 */
export function safeAiError(message:string):string {
 return message.replace(/Bearer\s+\S+/gi,'Bearer [已隐藏]').replace(/sk-[A-Za-z0-9_-]+/g,'[密钥已隐藏]').replace(/(api[_-]?key|token|authorization)(["'\s:=]+)[^\s,;"']+/gi,'$1$2[已隐藏]').slice(0,700)
}
export function assertAiFinish(finish:FinishReason,route:{provider:string;model:string},maxTokens:number,usage?:TokenUsage):void {
 if(finish.kind==='stop') return
 let reason:string
 let code:string
 if(finish.kind==='error' || finish.kind==='aborted') {
  code=finish.failure.code
  reason=finish.failure.message
 } else if(finish.kind==='max-tokens') {
  code='MAX_TOKENS'
  reason=`输出达到上限 ${maxTokens} tokens${usage ? `，实际输出 ${usage.outputTokens}` : ''}`
 } else { code='UNEXPECTED_FINISH';reason=`收到非文本终止类型 ${finish.kind}` }
 const error=new Error(safeAiError(`AI 整理失败 [${route.provider}/${route.model}] ${code}：${reason}`)) as Error & {code:string}
 error.code=code
 throw error
}
