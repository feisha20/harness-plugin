import {readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

export class SprintPreferences {
  constructor(path=fileURLToPath(new URL('./.local/ignored-sprints.json',import.meta.url))) {this.path=path;}
  list() {
    try {
      const value=JSON.parse(readFileSync(this.path,'utf8'));
      if (!Array.isArray(value)||value.some(x=>!x||!/^[1-9]\d*$/.test(String(x.id)))) throw Error();
      return value;
    } catch(e) {
      if(e.code==='ENOENT')return [];
      throw Error('忽略清单读取失败，已停止加载，避免重新加载已忽略冲刺');
    }
  }
  set({id,ignored,name='',projectName=''}) {
    id=String(id);
    if(!/^[1-9]\d*$/.test(id)||typeof ignored!=='boolean'||typeof name!=='string'||typeof projectName!=='string')throw Error('忽略设置参数无效');
    const items=this.list().filter(x=>x.id!==id);
    if(ignored)items.push({id,name:name.slice(0,300),projectName:projectName.slice(0,300)});
    mkdirSync(dirname(this.path),{recursive:true});
    const temp=this.path+'.tmp';
    writeFileSync(temp,JSON.stringify(items,null,2),{mode:0o600});
    renameSync(temp,this.path);
    return {ignoredSprints:items};
  }
}
export const preferences=new SprintPreferences();
