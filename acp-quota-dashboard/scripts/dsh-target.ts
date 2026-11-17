import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/** 开发依赖固定编译基线；运行兼容声明只列已验证的精确宿主版本。 */
export function hostTargetsOf(pkg: { devDependencies?: Record<string, unknown>; engines?: { dsh?: unknown } }) {
  const sourceVersion = pkg.devDependencies?.['@deepseek-ai/dsh']
  if (typeof sourceVersion !== 'string' || !exactVersion.test(sourceVersion))
    throw new Error('开发依赖 @deepseek-ai/dsh 必须固定一个精确版本')
  const compatRange = pkg.engines?.dsh
  if (typeof compatRange !== 'string') throw new Error('engines.dsh 必须列出已验证的精确宿主版本')
  const versions = compatRange.split(' || ')
  if (versions.some((version) => !exactVersion.test(version)) || new Set(versions).size !== versions.length)
    throw new Error('engines.dsh 仅允许用 || 连接不重复的精确版本，不允许宽泛范围')
  if (!versions.includes(sourceVersion)) throw new Error('运行兼容版本必须包含编译基线')
  return { sourceVersion, compatRange, versions }
}

const targets = hostTargetsOf(manifest)
export const DSH_SOURCE_VERSION = targets.sourceVersion
export const DSH_SOURCE_TAG = `dsh-v${DSH_SOURCE_VERSION}`
export const DSH_COMPAT_RANGE = targets.compatRange
