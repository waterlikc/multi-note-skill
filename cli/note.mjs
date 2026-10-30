import { readFile, writeFile, access, mkdir, rm, mkdtemp, copyFile } from 'node:fs/promises';
import { resolve, dirname, join, relative, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { renderFile } from '../src/render/file.mjs';
import { generateInteractive } from '../src/render/note.mjs';
import { mergeState } from '../src/state.mjs';
import { cardsFromNote, toCsv, withBom } from '../src/export/cards.mjs';
import { buildPlan, renderPlanHtml } from '../src/export/plan.mjs';
import { auditHtml, auditCsv, auditPlan } from '../src/audit.mjs';
import { checkNote, checkHtml } from '../src/conformance.mjs';
import { parseSubtitles, toSources } from '../src/subtitles.mjs';
import { buildPack } from '../src/export/pack.mjs';
import { renderAnimation } from '../src/animation/svg.mjs';
import { buildTimeline } from '../src/animation/timeline.mjs';
import { buildFrameHtml, findBrowser, framePath } from '../src/animation/export.mjs';
import { validateNote } from '../src/contract.mjs';
import { fetchVideo } from '../src/video.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const exists = async path => { try { await access(path); return true; } catch { return false; } };

export const HELP = [
  '用法：node cli/note.mjs <命令> [参数]',
  '',
  '  render <笔记.json> <输出.html> [状态.json]   渲染单文件笔记',
  '  update <旧状态.json> <更新.json> <新状态.json> 增量合并（冲突退出码 2）',
  '  cards  <笔记.json> <输出.csv>               导出 Anki 卡片',
  '  plan   <状态.json> <输出.html> [--days 7] [--start YYYY-MM-DD]',
  '  audit  [目录]                               审计产物（默认 examples/）',
  '  lint   <笔记.json> [产物.html]              规范检查（契约之外的结构基线）',
  '  subs   <字幕.srt|.vtt> [最长字符]           把字幕转成来源块 JSON',
  '  video  <视频链接> [来源.json]               取公开字幕并转来源块（取不到退出 1）',
  '  pack   <笔记目录> <课程包.html>             批量渲染并生成课程索引',
  '  animate <笔记.json|动画块.json> <out.gif|mp4> [--block <id>] [--fps 12] [--width 960] [--style style-b]',
  '',
  '退出码：0 成功 / 1 输入或校验错误 / 2 合并冲突 / 3 缺少浏览器或 ffmpeg'
].join(String.fromCharCode(10));

export async function runRender(args) {
  const interactive = args.includes('--interactive');
  const rest = args.filter(arg => arg !== '--interactive');
  const [input, output, stateFile] = rest;
  if (!input || !output) throw new Error('render 需要输入与输出两个路径');
  if (interactive) {
    if ([input, stateFile].filter(Boolean).some(path => resolve(path) === resolve(output))) throw new Error('输出不能覆盖输入');
    const data = JSON.parse(await readFile(input, 'utf8'));
    const embedded = data?.note && data?.graph ? data : undefined;
    const note = embedded ? embedded.note : data;
    const state = stateFile ? JSON.parse(await readFile(stateFile, 'utf8')) : embedded;
    const { html } = await generateInteractive(note, state);
    await writeFile(output, html, 'utf8');
    console.log('已生成交互版 ' + output);
    return;
  }
  const written = await renderFile(input, output, stateFile);
  console.log('已生成 ' + written);
}

export async function runUpdate(args) {
  const [oldPath, patchPath, outputPath] = args;
  if (!oldPath || !patchPath || !outputPath) throw new Error('update 需要旧状态、更新、新状态三个路径');
  if ([oldPath, patchPath].some(path => resolve(path) === resolve(outputPath))) throw new Error('新状态不能覆盖输入文件');
  const old = JSON.parse(await readFile(oldPath, 'utf8'));
  const patch = JSON.parse(await readFile(patchPath, 'utf8'));
  const result = mergeState(old, patch);
  if (result.conflicts.length) {
    console.error(JSON.stringify({ message: '检测到冲突，未写入新状态', conflicts: result.conflicts }, null, 2));
    return 2;
  }
  await writeFile(outputPath, JSON.stringify(result.state, null, 2) + String.fromCharCode(10), { encoding: 'utf8', flag: 'wx' });
  console.log('已写入版本 ' + result.state.note.revision + '：' + outputPath);
  return 0;
}

export async function runCards(args) {
  const [input, output] = args;
  if (!input || !output) throw new Error('cards 需要输入与输出两个路径');
  if (resolve(input) === resolve(output)) throw new Error('输出不能覆盖输入');
  if (await exists(output)) throw new Error('输出文件已存在，换一个文件名');
  const data = JSON.parse(await readFile(input, 'utf8'));
  const note = data?.note && data?.graph ? data.note : data;
  const csv = toCsv(cardsFromNote(note));
  await writeFile(output, withBom(csv), 'utf8');
  console.log('已导出 ' + (csv.split(String.fromCharCode(10)).length - 2) + ' 张卡片：' + output);
}

export async function runPlan(args) {
  const [input, output] = args;
  if (!input || !output) throw new Error('plan 需要状态与输出两个路径');
  const index = args.indexOf('--days');
  const days = index >= 0 ? Number(args[index + 1]) : 7;
  if (!Number.isSafeInteger(days) || days < 1 || days > 60) throw new Error('--days 必须是 1—60 的整数');
  const startIndex = args.indexOf('--start');
  const start = startIndex >= 0 ? args[startIndex + 1] : null;
  const state = JSON.parse(await readFile(input, 'utf8'));
  const plan = buildPlan(state, { days, start });
  await writeFile(output, renderPlanHtml(state, plan, days), 'utf8');
  console.log('已生成 ' + days + ' 天计划：' + output + (start ? '（起始 ' + start + '）' : ''));
}

export async function runAudit(args) {
  const target = args[0] ? resolve(process.cwd(), args[0]) : join(root, 'examples');
  let failures = 0;
  for (const file of await collect(target, '.html')) {
    const issues = auditHtml(await readFile(file, 'utf8'));
    const name = relative(target, file);
    if (issues.length) { failures++; console.error('✗ ' + name + '：' + issues.join('；')); }
    else console.log('✓ ' + name);
  }
  for (const file of await collect(target, '.csv')) {
    const issues = auditCsv(await readFile(file, 'utf8'));
    const name = relative(target, file);
    if (issues.length) { failures++; console.error('✗ ' + name + '：' + issues.join('；')); }
    else console.log('✓ ' + name);
  }
  for (const stateFile of [join(target, 'advanced', 'math-objectives.state.json'), join(target, 'note.state.json')]) {
    try {
      const planIssues = auditPlan(JSON.parse(await readFile(stateFile, 'utf8')), 5);
      if (planIssues.length) { failures++; console.error('✗ 学习计划：' + planIssues.join('；')); }
      else console.log('✓ 学习计划 ' + relative(root, stateFile));
    } catch { /* 没有状态文件就跳过 */ }
  }
  console.log(failures ? '审计未通过：' + failures + ' 项' : '审计通过：产物无外链、无失效锚点、表格与计划顺序一致');
  return failures ? 1 : 0;
}

async function collect(dir, suffix, out = []) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path, suffix, out);
    else if (entry.name.endsWith(suffix)) out.push(path);
  }
  return out;
}

export async function runLint(args) {
  const [input, htmlFile] = args;
  if (!input) throw new Error('用法：node cli/note.mjs lint 笔记.json [产物.html]');
  const note = JSON.parse(await readFile(resolve(input), 'utf8'));
  const issues = checkNote(note);
  if (htmlFile) issues.push(...checkHtml(await readFile(resolve(htmlFile), 'utf8'), note));
  if (issues.length) {
    console.error('✗ ' + relative(root, resolve(input)) + '：' + issues.length + ' 项');
    for (const issue of issues) console.error('  - ' + issue);
    return 1;
  }
  console.log('✓ 规范检查通过：' + relative(root, resolve(input)));
  return 0;
}

export async function runSubs(args) {
  const [input, maxChars] = args;
  if (!input) throw new Error('用法：node cli/note.mjs subs 字幕.srt [最长字符]');
  const cues = parseSubtitles(await readFile(resolve(input), 'utf8'));
  if (!cues.length) throw new Error('没有解析到字幕：确认是 SRT 或 VTT');
  const limit = Number(maxChars) > 0 ? Number(maxChars) : 600;
  console.log(JSON.stringify(toSources(cues, { maxChars: limit }), null, 2));
  return 0;
}

export async function runPack(args) {
  const [dir, out] = args;
  if (!dir || !out) throw new Error('用法：node cli/note.mjs pack 笔记目录 课程包.html');
  const r = await buildPack(dir, out);
  console.log('已生成 ' + out + '：' + r.notes + ' 份笔记，' + r.sections + ' 节，' + r.issues + ' 个审计问题，' + r.keywords + ' 个关键词');
  return r.issues ? 1 : 0;
}


export async function runVideo(args) {
  const [input, output] = args;
  if (!input) throw new Error('用法：node cli/note.mjs video <视频链接> [来源.json]');
  if (output && resolve(input) === resolve(output)) throw new Error('输出不能覆盖输入');
  const result = await fetchVideo(input);
  if (result.status === 'ready') {
    if (output) await writeFile(resolve(output), JSON.stringify(result, null, 2) + String.fromCharCode(10), 'utf8');
    console.log('已取得 ' + result.cues.length + ' 条字幕，合并为 ' + result.sources.length + ' 个来源' + (output ? '：' + output : ''));
    if (!output) console.log(JSON.stringify(result, null, 2));
    return 0;
  }
  console.error(result.reason || '没有取得字幕或转写');
  if (result.next) console.error(result.next);
  return 1;
}

export async function runAnimate(args) {
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { i++; continue; }
    positional.push(args[i]);
  }
  const [input, output] = positional;
  const opt = name => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : undefined; };
  const blockId = opt('block');
  const fps = Math.max(4, Math.min(30, Number(opt('fps')) || 12));
  const width = Math.max(480, Math.min(1920, Number(opt('width')) || 960));
  const style = opt('style');
  const format = (opt('format') || (output && output.toLowerCase().endsWith('.mp4') ? 'mp4' : 'gif')).toLowerCase();
  if (!input || !output) throw new Error('用法：node cli/note.mjs animate 笔记.json out.gif --block <id>');
  const data = JSON.parse(await readFile(resolve(input), 'utf8'));
  let found;
  if (data.type === 'animation') {
    found = data;
  } else {
    validateNote(data);
    const blocks = data.sections.flatMap(section => section.blocks ?? []).filter(block => block.type === 'animation');
    found = blockId ? blocks.find(block => block.id === blockId) : blocks.length === 1 ? blocks[0] : null;
    if (!found) throw new Error(blockId ? '找不到动画块：' + blockId : '有多个动画块，请用 --block 指定');
  }
  const rendered = renderAnimation(found, { style: style ?? data.style });
  const timeline = buildTimeline(found);
  const browser = findBrowser();
  if (!browser) { const error = new Error('找不到 Chrome/Edge；设置 CHROME_PATH，或先输出 HTML 动画'); error.exitCode = 3; throw error; }
  if (format !== 'frames' && spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
    const error = new Error('找不到 ffmpeg；设置 FFMPEG_PATH，或加 --format frames 只导出逐帧 PNG'); error.exitCode = 3; throw error;
  }
  const start = 0.2;
  const frames = Math.max(1, Math.ceil((timeline.total - start) * fps));
  const dir = await mkdtemp(join(tmpdir(), 'multi-note-anim-'));
  try {
    const height = Math.round(width * 0.66) + 40;
    for (let i = 0; i < frames; i++) {
      const htmlPath = join(dir, 'frame-' + String(i).padStart(4, '0') + '.html');
      await writeFile(htmlPath, buildFrameHtml(rendered, start + i / fps, width), 'utf8');
      execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=' + width + ',' + height,
        '--screenshot=' + framePath(dir, i), pathToFileURL(htmlPath).href], { stdio: 'ignore', timeout: 30000 });
    }
    if (format === 'frames') {
      const outDir = resolve(output);
      await rm(outDir, { recursive: true, force: true });
      await mkdir(outDir, { recursive: true });
      for (let i = 0; i < frames; i++) await copyFile(framePath(dir, i), join(outDir, basename(framePath(dir, i))));
      console.log('已生成逐帧 PNG：' + outDir + '（' + frames + ' 帧，' + fps + ' fps）');
      return 0;
    }
    const outPath = resolve(output);
    const pattern = join(dir, 'frame-%04d.png');
    const ff = process.env.FFMPEG_PATH || 'ffmpeg';
    const ffArgs = format === 'mp4'
      ? ['-y', '-framerate', String(fps), '-i', pattern, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath]
      : ['-y', '-framerate', String(fps), '-i', pattern, '-vf', 'scale=' + width + ':-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0', outPath];
    execFileSync(ff, ffArgs, { stdio: 'ignore', timeout: 120000 });
    console.log('已生成动画：' + outPath + '（' + timeline.total.toFixed(1) + ' 秒 / ' + frames + ' 帧）');
    return 0;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') { console.log(HELP); return 0; }
  if (command === 'render') { await runRender(rest); return 0; }
  if (command === 'update') return await runUpdate(rest);
  if (command === 'cards') { await runCards(rest); return 0; }
  if (command === 'plan') { await runPlan(rest); return 0; }
  if (command === 'audit') return await runAudit(rest);
  if (command === 'lint') return await runLint(rest);
  if (command === 'subs') return await runSubs(rest);
  if (command === 'video') return await runVideo(rest);
  if (command === 'pack') return await runPack(rest);
  if (command === 'animate') return await runAnimate(rest);
  throw new Error('未知命令：' + command + '（--help 查看用法）');
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = error.exitCode ?? 1;
  });
}