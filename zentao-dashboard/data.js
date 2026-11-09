import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const script = process.env.ZENTAO_QA_SCRIPT || '/Users/linjt/.agents/skills/zentao-qa/scripts/zentao_qa.py';
const config = process.env.ZENTAO_QA_CONFIG;
const cache = new Map();
export const CACHE_TTL_MS = 10 * 60 * 1000;
export async function read(resource, scope, id) {
  const args = [script, ...(config ? ['--config', config] : []), 'read', resource, '--all'];
  if (scope) args.push('--scope', scope, '--scope-id', String(id));
  const key = args.join('|'), hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;
  const promise = run('python3', args, { timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
    .then(({stdout}) => {
      const data = JSON.parse(stdout);
      if (!data.ok || !data.complete) throw Error('清单不完整');
      return data.items.filter(x => !['1', 'true'].includes(String(x.deleted)));
    }).catch(() => { cache.delete(key); throw Error('禅道读取失败：请检查本机认证、网络与查询权限'); });
  cache.set(key, {at: Date.now(), promise});
  if (cache.size > 100) cache.delete(cache.keys().next().value);
  return promise;
}
export const pick = (items, fields) => items.map(x => Object.fromEntries(fields.map(k => [k, x[k] ?? ''])));
export const fields = {
  catalog: ['id','name','status'],
  executions: ['id','name','status','begin','end','progress','PM','QD','product'],
  bugs: ['id','title','status','pri','severity','assignedTo','responsible','openedBy','openedDate','lastEditedDate','resolvedDate','deadline','onlineIssue','execution','product'],
  stories: ['id','title','status','stage','pri'],
  tasks: ['id','name','status','type','assignedTo','deadline','left','consumed','parent','isParent']
};
export function isOnline(b) { return ['1','true'].includes(String(b.onlineIssue)); }
export function isCandidate(b) { return !isOnline(b) && /生产|线上/.test(b.title || ''); }
export function daysOpen(b, now = Date.now()) {
  const value = String(b.openedDate || '');
  const start = Date.parse(value.replace(' ', 'T') + '+08:00');
  return Number.isFinite(start) ? Math.max(0, Math.floor((now-start)/86400000)) : null;
}
