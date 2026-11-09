import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SprintPreferences} from './preferences.js';
test('忽略清单持久化、恢复与损坏处理',()=>{
 const dir=mkdtempSync(join(tmpdir(),'zentao-prefs-'));
 try {
  const path=join(dir,'nested','ignored.json'),p=new SprintPreferences(path);
  assert.deepEqual(p.list(),[]);
  p.set({id:'42',ignored:true,name:'测试冲刺'});
  assert.equal(new SprintPreferences(path).list()[0].name,'测试冲刺');
  p.set({id:'43',ignored:true,name:'另一项'});
  p.set({id:'42',ignored:false});
  assert.deepEqual(p.list().map(s=>s.id),['43']);
  assert.throws(()=>p.set({id:'bad',ignored:true}));
  writeFileSync(path,'invalid json');
  assert.throws(()=>p.list(),/停止加载/);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
