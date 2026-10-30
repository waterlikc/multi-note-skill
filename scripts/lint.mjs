// 检查入口：node scripts/lint.mjs note.json out.html；依赖 ../cli 与 ../src。
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runLint } from '../cli/note.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(runLint(process.argv.slice(2))).then(code => { if (typeof code === 'number') process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
