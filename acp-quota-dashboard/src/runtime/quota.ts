/// <reference types="node" />
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SubprocessSeam } from './process/subprocess.ts'
import type { QuotaView } from '../contract/quota.ts'

/** 只接收官方状态行白名单，不读取 OAuth 文件、会话正文或私有接口；邮箱仅向设备所有者展示。 */
export function decodeQuota(raw: unknown): QuotaView {
  if (typeof raw !== 'object' || raw === null) throw new Error('官方 CLI 未返回额度数据')
  const data = raw as Record<string, unknown>
  const quota = data.quota
  if (typeof quota !== 'object' || quota === null || Array.isArray(quota)) throw new Error('当前 CLI 未提供额度字段')
  const buckets = Object.entries(quota)
    .slice(0, 32)
    .flatMap(([id, value]) => {
      if (!/^[a-z0-9-]{1,80}$/.test(id) || typeof value !== 'object' || value === null) return []
      const v = value as Record<string, unknown>
      const fraction = v.remaining_fraction
      const amount = v.remaining_amount
      return [
        {
          id,
          remainingPercent:
            typeof fraction === 'number' && Number.isFinite(fraction) && fraction >= 0 && fraction <= 1
              ? fraction * 100
              : null,
          remainingAmount: typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? amount : null,
          resetTime:
            typeof v.reset_time === 'string' && Number.isFinite(Date.parse(v.reset_time))
              ? new Date(v.reset_time).toISOString()
              : null,
          disabled: v.disabled === true,
        },
      ]
    })
  if (buckets.length === 0) throw new Error('官方 CLI 暂未提供可用额度，请先在 agy 中登录后重试')
  return {
    account:
      typeof data.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && data.email.length <= 254
        ? data.email
        : null,
    plan: typeof data.plan_tier === 'string' ? data.plan_tier.slice(0, 80) : null,
    buckets,
    fetchedAt: new Date().toISOString(),
    source: 'official-cli-statusline',
  }
}

// Python3 的 PTY 仅承载官方交互 CLI；不发送模型提示词，不改写用户设置。
const COLLECTOR = String.raw`
import os,sys,json,pty,subprocess,select,time,signal,shlex
from pathlib import Path
root=Path(__file__).parent
if len(sys.argv)>1 and sys.argv[1]=='capture':
 try:
  p=json.load(sys.stdin)
  if p.get('quota'):
   target=root/'quota.json'; staging=root/('quota-'+str(os.getpid())+'.tmp')
   staging.write_text(json.dumps({k:p.get(k) for k in ['quota','plan_tier','email']}));staging.replace(target)
 except Exception: pass
 print('额度状态已读取');sys.exit(0)
cfg=json.load(sys.stdin)
signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
settings={'statusLine':{'type':'command','command':shlex.join([sys.executable,__file__,'capture'])}}
m,s=pty.openpty()
env=dict(os.environ);env.update(cfg.get('env',{}));env['TERM']='xterm-256color'
p=None
try:
 p=subprocess.Popen([cfg['command'],'--settings',json.dumps(settings)],stdin=s,stdout=s,stderr=s,cwd=str(root),env=env,start_new_session=True)
 os.close(s);s=-1
 end=time.monotonic()+22;sent=False;ready=time.monotonic()+4
 while time.monotonic()<end:
  if select.select([m],[],[],.2)[0]:
   try: os.read(m,65536)
   except OSError: break
  if not sent and time.monotonic()>ready:
   os.write(m,b'/usage\r');sent=True
  if sent and time.monotonic()>ready+4 and (root/'quota.json').exists():
   print((root/'quota.json').read_text());break
  if p.poll() is not None:break
 else: raise RuntimeError('额度查询超时')
finally:
 if p is not None:
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  try:p.wait(timeout=3)
  except subprocess.TimeoutExpired:
   os.killpg(p.pid,signal.SIGKILL);p.wait()
 if s!=-1:os.close(s)
 os.close(m)
`

/** 每个 Remote 实例合并查询；不自动轮询，也不缓存账号额度。 */
export async function readOfficialQuota(
  seam: SubprocessSeam,
  command: string,
  env: Record<string, string>,
): Promise<QuotaView> {
  if (process.platform === 'win32') throw new Error('额度查询当前支持 macOS 和 Linux，需要 Python3')
  const root = await mkdtemp(join(tmpdir(), 'dsh-quota-'))
  let handle: ReturnType<SubprocessSeam['spawn']> | undefined
  try {
    const script = join(root, 'collector.py')
    await writeFile(script, COLLECTOR, { mode: 0o600 })
    const python = await seam.resolveExecutable('python3')
    handle = seam.spawn({ argv: [python, script], cwd: root, graceMs: 4000 })
    let output = ''
    let overflow = false
    handle.stdout?.on('data', (part: Buffer) => {
      if (output.length + part.length > 65536) {
        overflow = true
        handle?.terminate()
      } else output += part.toString('utf8')
    })
    handle.stderr?.resume() // 错误流可能含账号信息，不向 UI 或日志转发。
    handle.stdin?.end(JSON.stringify({ command, env }))
    const timer = setTimeout(() => handle?.terminate(), 30_000)
    try {
      const outcome = await handle.done
      if (overflow || outcome.exitCode !== 0)
        throw new Error('无法读取官方 CLI 额度，请确认 agy 已登录、网络可用且 Python3 已安装')
      return decodeQuota(JSON.parse(output))
    } finally {
      clearTimeout(timer)
      handle.terminate()
      await handle.waitForExit()
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
