import { describe, expect, it } from 'vitest'
import { hostTargetsOf, DSH_SOURCE_VERSION, DSH_COMPAT_RANGE } from '../../scripts/dsh-target.ts'

describe('编译基线与已验证宿主声明', () => {
  const pkg = (range: string, source = '0.2.1-rc.4') => ({
    devDependencies: { '@deepseek-ai/dsh': source },
    engines: { dsh: range },
  })
  it('保留精确编译依赖，同时接受逐个验证的新宿主', () => {
    expect(hostTargetsOf(pkg('0.2.1-rc.4 || 0.2.2-rc.3'))).toEqual({
      sourceVersion: '0.2.1-rc.4',
      compatRange: '0.2.1-rc.4 || 0.2.2-rc.3',
      versions: ['0.2.1-rc.4', '0.2.2-rc.3'],
    })
    expect(DSH_SOURCE_VERSION).toBe('0.2.1-rc.4')
    expect(DSH_COMPAT_RANGE.split(' || ')).toContain('0.2.2-rc.3')
  })
  it.each(['*', '>=0.2.1', '^0.2.2', '0.2.1-rc.4 || >=0.2.2', '0.2.1-rc.4 || 0.2.1-rc.4'])(
    '拒绝宽泛或重复声明：%s',
    (range) => expect(() => hostTargetsOf(pkg(range))).toThrow(),
  )
  it('不能遗漏编译基线或使用浮动开发依赖', () => {
    expect(() => hostTargetsOf(pkg('0.2.2-rc.3'))).toThrow('编译基线')
    expect(() => hostTargetsOf(pkg('0.2.2-rc.3', '^0.2.2'))).toThrow('精确版本')
  })
})
