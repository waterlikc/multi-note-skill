import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runCards } from '../cli/note.mjs';
export * from '../src/export/cards.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(runCards(process.argv.slice(2))).then(code => { if (typeof code === 'number') process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
