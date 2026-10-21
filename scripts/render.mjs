import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runRender } from '../cli/note.mjs';
export { renderFile } from '../src/render/file.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(runRender(process.argv.slice(2))).then(code => { if (typeof code === 'number') process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
