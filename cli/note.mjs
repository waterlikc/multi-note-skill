import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderFile } from '../src/render/file.mjs';
import { generateInteractive } from '../src/render/note.mjs';
import { mergeState } from '../src/state.mjs';
import { cardsFromNote, toCsv, withBom } from '../src/export/cards.mjs';
import { buildPlan, renderPlanHtml } from '../src/export/plan.mjs';
import { auditHtml, auditCsv, auditPlan } from '../src/audit.mjs';

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
  '',
  '退出码：0 成功 / 1 输入或校验错误 / 2 合并冲突'
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

export async function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') { console.log(HELP); return 0; }
  if (command === 'render') { await runRender(rest); return 0; }
  if (command === 'update') return await runUpdate(rest);
  if (command === 'cards') { await runCards(rest); return 0; }
  if (command === 'plan') { await runPlan(rest); return 0; }
  if (command === 'audit') return await runAudit(rest);
  throw new Error('未知命令：' + command + '（--help 查看用法）');
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }).catch(error => {
    console.error('失败：' + error.message);
    process.exitCode = 1;
  });
}
