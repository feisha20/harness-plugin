import {test} from 'node:test'
import assert from 'node:assert/strict'
import {assertAiFinish,safeAiError} from '../lib/host/aiFailure.js'
const route={provider:'ordinary',model:'model-a'}
test('保留真正的终止错误码和服务端原因，而非统一替换',()=>{
 assert.throws(()=>assertAiFinish({kind:'error',failure:{code:'AUTH',message:'身份验证失败'}},route,2000),error=>error.code==='AUTH' && error.message.includes('ordinary/model-a') && error.message.includes('身份验证失败'))
 assert.throws(()=>assertAiFinish({kind:'max-tokens'},route,2000,{outputTokens:2000}),/MAX_TOKENS.*2000/)
 assert.doesNotThrow(()=>assertAiFinish({kind:'stop'},route,2000))
})
test('诊断错误不暴露凭据',()=>{
 const text=safeAiError('Authorization: Bearer secret-value api_key=sk-testabc')
 assert.doesNotMatch(text,/secret-value|sk-testabc/)
})
