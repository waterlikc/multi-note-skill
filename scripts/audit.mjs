import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runAudit } from '../cli/note.mjs';
export * from '../src/audit.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(runAudit(process.argv.slice(2))).then(code => { if (typeof code === 'number') process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
