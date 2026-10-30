// 视频入口：node scripts/video.mjs <链接> [来源.json]；依赖 ../cli 与 ../src。
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runVideo } from '../cli/note.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(runVideo(process.argv.slice(2))).then(code => { if (typeof code === 'number') process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
