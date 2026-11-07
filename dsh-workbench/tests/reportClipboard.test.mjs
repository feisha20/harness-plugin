import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatReportClipboard, copyReport } from '../lib/shared/reportClipboard.js'
const report='工作日报（2026-11-07）\n\n### 一、今日重点工作\n#### 1. 报告整理\n• **开发**自动汇总功能\n• 梳理 `接口`\n\n### 二、问题与需协调事项\n待确认'
test('粘贴内容包含排版后的 HTML 和无 Markdown 标记的纯文本', () => {
  const {html,text}=formatReportClipboard(report)
  assert.doesNotMatch(text, /###|\*\*|`/)
  assert.match(text,/一、今日重点工作\n1\. 报告整理\n　　• 开发自动汇总功能/)
  assert.match(html,/<strong>开发<\/strong>/)
  assert.match(html,/<ul[^>]*><li/)
  assert.doesNotMatch(html,/###|\*\*/)
})
test('正文 HTML 被转义，旧标题括号被去除，列表序号保留', () => {
  const {html,text}=formatReportClipboard('【工作概览】\n<img src=x onerror=alert(1)>\n\n3. 第三项')
  assert.doesNotMatch(html,/<img/)
  assert.match(html,/&lt;img/)
  assert.match(html,/<ol start="3"/)
  assert.match(text,/^工作概览/)
  assert.match(text,/3\. 第三项/)
})
async function withClipboard(clipboard, callback) {
  const navigatorDescriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator')
  const itemDescriptor=Object.getOwnPropertyDescriptor(globalThis,'ClipboardItem')
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard}})
  Object.defineProperty(globalThis,'ClipboardItem',{configurable:true,value:class { constructor(data) {this.data=data} }})
  try {await callback()} finally {
    if(navigatorDescriptor) Object.defineProperty(globalThis,'navigator',navigatorDescriptor); else delete globalThis.navigator
    if(itemDescriptor) Object.defineProperty(globalThis,'ClipboardItem',itemDescriptor); else delete globalThis.ClipboardItem
  }
}
test('一次写入同一条剪贴板项目的两种格式', async () => {
  await withClipboard({write:async items=>{
    assert.equal(items.length,1)
    assert.equal(items[0].data['text/html'].type,'text/html')
    assert.equal(await items[0].data['text/plain'].text(),formatReportClipboard(report).text)
  },writeText:async()=>assert.fail('不应重复写入')},()=>copyReport(report))
})
test('富文本写入失败时降级干净纯文本，全部失败时向调用方报错', async () => {
  let text=''
  await withClipboard({write:async()=>{throw Error('不支持')},writeText:async value=>{text=value}},()=>copyReport(report))
  assert.doesNotMatch(text,/###|\*\*/)
  assert.ok(text.includes('今日重点工作'))
  await withClipboard({write:async()=>{throw Error('拒绝')},writeText:async()=>{throw Error('无权限')}},()=>assert.rejects(copyReport(report),/无权限/))
})

test('工作方向下的子项缩进，进入下一章后恢复普通列表缩进', () => {
  const {html,text}=formatReportClipboard('### 一、重点工作\n#### 1. 工作方向\n• 子项\n### 二、协调事项\n• 协调事项')
  assert.match(html,/<ul style="margin:4px 0 8px 24px;padding-left:22px">/)
  assert.match(html,/<ul style="margin:4px 0 8px 0px;padding-left:22px">/)
  assert.match(text,/1\. 工作方向\n　　• 子项/)
  assert.match(text,/二、协调事项\n　• 协调事项/)
})
