// 合并入口：node scripts/update.mjs 旧状态.json 更新.json 新状态.json；依赖 ../cli 与 ../src。
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runUpdate } from '../cli/note.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(runUpdate(process.argv.slice(2))).then(code => { if (typeof code === 'number') process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
