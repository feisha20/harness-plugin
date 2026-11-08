import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { expect, it } from 'vitest'
import { installAcpTextGeneration } from '../../../src/host/composition/text-generation.ts'
import { sharedTestSubprocess } from '../../fixtures/subprocess-seam-testing.ts'

const provider = 'acp-antigravity'
const model = 'test-exact-model'
const gemini = 'gemini-3.8-flash'
const agent = fileURLToPath(new URL('../../mock-agent/mock-agent.ts', import.meta.url))

async function withService(scenario: string, run: (generate: (id: string) => Promise<string>) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-acp-text-test-'))
  const log = join(directory, 'protocol.log')
  const ctx = new Context()
  try {
    const { seam } = await sharedTestSubprocess()
    const config = {
      name: 'Antigravity 测试',
      command: process.execPath,
      args: [agent],
      runtime: 'antigravity' as const,
      env: {
        MOCK_SCENARIO: scenario,
        MOCK_LOG: log,
        MOCK_MODEL_OPTIONS: JSON.stringify([
          { value: 'default-model', name: '默认' },
          { value: model, name: '测试' },
          { value: gemini, name: 'Gemini 3.8 Flash' },
        ]),
        MOCK_MODEL_THOUGHT_LEVELS: JSON.stringify({
          'default-model': ['high', 'low'],
          [gemini]: ['high', 'low'],
          [model]: ['high', 'low'],
        }),
      },
    }
    installAcpTextGeneration(
      ctx,
      {
        resolveRoute: (route) => (route === provider ? { id: 'antigravity', config } : undefined),
      },
      { ok: true, seam },
    )
    const service = ctx.get('dshAcpTextGeneration')
    expect(service.supports(provider)).toBe(true)
    expect(service.supports('acp-other')).toBe(false)
    await run((id) => service.generate(provider, id, '仅输出文本', '{}', AbortSignal.timeout(8000)))
    return await readFile(log, 'utf8')
  } finally {
    await ctx.fiber.dispose()
    await rm(directory, { recursive: true, force: true })
  }
}

it('切换并确认精确模型后收集文本，结束时清理 ACP 会话', async () => {
  const log = await withService('text-only', async (generate) => {
    await expect(generate(model)).resolves.toBe('整理了测试资料')
  })
  expect(log).toContain(`set_config_option configId=model value="${model}"`)
  expect(log).not.toContain('set_config_option configId=thought_level')
  expect(log).toContain('session/delete')
})

it('工作日志用 Gemini 3.8 Flash 时先选模型，再切换到低推理档', async () => {
  const log = await withService('text-only', async (generate) => {
    await expect(generate(gemini)).resolves.toBe('整理了测试资料')
  })
  expect(log).toMatch(
    /set_config_option configId=model value="gemini-3\.8-flash"[\s\S]*set_config_option configId=thought_level value="low"/,
  )
})

it('目录缺少指定模型时拒绝调用，尝试运行工具时中止整理', async () => {
  const missing = await withService('text-only', async (generate) => {
    await expect(generate('unknown')).rejects.toThrow('当前会话没有这个模型')
  })
  expect(missing).not.toContain('session/prompt')
  const rejected = await withService('permission-flow', async (generate) => {
    await expect(generate(model)).rejects.toThrow(/工具/)
  })
  expect(rejected).not.toContain('optionId=allow')
})
