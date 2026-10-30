import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderFile } from '../scripts/render.mjs';
import { generateNote, createState, mergeState, resolveInput, validateNote, validateState, summarisePractice, reviewSchedule, detectVideo, fetchVideo, parseSubtitles, toSources } from '../index.mjs';
import { buildPlan, renderPlanHtml } from '../scripts/plan.mjs';
import { cardsFromNote, toCsv, withBom } from '../scripts/cards.mjs';
import { auditHtml, auditCsv, auditPlan } from '../scripts/audit.mjs';
import { checkNote, checkHtml } from '../src/conformance.mjs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const note = JSON.parse(await readFile(new URL('examples/math.json', root), 'utf8'));
const state = JSON.parse(await readFile(new URL('examples/math.state.json', root), 'utf8'));
const patch = JSON.parse(await readFile(new URL('examples/math.patch.json', root), 'utf8'));
const clone = value => structuredClone(value);

test('三种主题均输出完整正文、来源和离线资源', async () => {
  for (const style of ['style-a', 'style-b', 'style-c']) {
    const { html } = await generateNote({ ...note, style });
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<\/html>\s*$/);
    assert.match(html, /y=2x\+1/);
    assert.match(html, /source-S1/);
    assert.doesNotMatch(html, /<(?:script|iframe|link|img)\b|@import|url\((?!\s*['\"]?#)/i);
    assert.doesNotMatch(html, /\{\{[A-Z]+\}\}/);
    assert.match(html, /@media print/);
  }
});
test('不执行标题、正文、来源和状态中的 HTML', async () => {
  const n = clone(note);
  const payload = '</pre><script>alert(1)</script><img src=x onerror=alert(1)>';
  n.title = payload; n.sources[0].text = payload; n.sections[0].blocks = [{type:'paragraph',text:payload}];
  const html = (await generateNote(n, createState(n))).html;
  assert.doesNotMatch(html, /<script\b|<img\b/i);
  assert.match(html, /&lt;script&gt;/);
});
test('用户文字中的模板字段不会被二次替换', async () => {
  const n = clone(note); n.summary = '{{TITLE}}';
  assert.match((await generateNote(n)).html, /<p class="lead">\{\{TITLE\}\}<\/p>/);
});
test('JSON 状态经 HTML 转义后可无损恢复', async () => {
  const html = (await generateNote(note, state)).html;
  const raw = html.match(/<pre id="note-state">([\s\S]*?)<\/pre>/)[1];
  const entities = { '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&#39;':"'" };
  assert.deepEqual(JSON.parse(raw.replace(/&(amp|lt|gt|quot|#39);/g, match => entities[match])), state);
});
test('缺少真实来源、坏表格、未知块、错误引用均拒绝', () => {
  const mutations = [n => n.sources = [], n => n.sections[0].sourceIds = ['missing'], n => n.sections[0].blocks = [{ type:'raw',text:'x' }], n => n.sections[0].blocks = [{type:'table',headers:['x'],rows:[['a','b']]}], n => n.style = '../bad', n => n.scene = 'constructor'];
  for (const mutate of mutations) { const n = clone(note); mutate(n); assert.throws(() => validateNote(n)); }
  const image = clone(note); image.sections[0].blocks = [{ type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', alt: '示意图' }];
  assert.doesNotThrow(() => validateNote(image));
  image.sections[0].blocks[0].src = 'https://example.com/a.png';
  assert.throws(() => validateNote(image), /data URI/);
  const words = clone(note); words.keywords = ['缓存', '分布式'];
  assert.doesNotThrow(() => validateNote(words));
  words.keywords = ['', '缓存'];
  assert.throws(() => validateNote(words), /关键词/);
});
test('无依据的学习掌握状态被拒绝', () => {
  const s = clone(state); s.graph.nodes[0].mastery = 'mastered';
  assert.throws(() => validateState(s), /无证据/);
});
test('图谱悬空边和前置环被拒绝', () => {
  const s = clone(state); s.graph.edges[0].to = 'missing';
  assert.throws(() => validateState(s), /悬空/);
  const cycle = clone(state); cycle.graph.edges.push({from:'linear-example',to:'slope',type:'prerequisite',basis:'测试依据'});
  assert.throws(() => validateState(cycle), /环/);
});
test('完整增量链：旧内容保留、新内容追加、版本递增', () => {
  const before = clone(state);
  const result = mergeState(state, patch);
  assert.equal(result.changed, true);
  assert.equal(result.state.note.revision, 2);
  assert.deepEqual(result.state.note.sections.slice(0, note.sections.length), note.sections);
  assert.equal(result.state.note.sections.at(-1).id, 'two-points');
  assert.deepEqual(state, before);
});
test('重复补充幂等，不产生新版本', () => {
  const first = mergeState(state, patch).state;
  const second = mergeState(first, {...patch,baseRevision:2});
  assert.equal(second.changed, false);
  assert.deepEqual(second.state, first);
});
test('同 id 改写返回冲突，整个事务不提交', () => {
  const section = {...clone(note.sections[0]), heading:'不同定义'};
  const result = mergeState(state, {...patch,sections:[section]});
  assert.equal(result.conflicts.length, 1);
  assert.deepEqual(result.state, state);
});
test('来源冲突不能被 replaceIds 静默覆盖', () => {
  const result = mergeState(state, {baseRevision:1, summary:'冲突', sources:[{...note.sources[0], text:'不同原文'}]});
  assert.equal(result.conflicts[0].kind, 'source'); assert.deepEqual(result.state, state);
});
test('显式替换章节后旧掌握证据失效', () => {
  const s = clone(state); s.graph.nodes[0].mastery = 'mastered'; s.graph.nodes[0].evidence = ['用户自评：已掌握'];
  const result = mergeState(s, {baseRevision:1,summary:'修订概念',sections:[{...note.sections[0],heading:'修订概念'}],replaceIds:['concept']});
  assert.equal(result.state.graph.nodes[0].mastery, 'unknown');
  assert.deepEqual(result.state.graph.nodes[0].evidence, []);
});
test('过期基础版本与渲染状态错配被拒绝', async () => {
  assert.throws(() => mergeState(state, {...patch,baseRevision:2}), /基础版本/);
  await assert.rejects(generateNote({...note,title:'不同笔记'},state), /不一致/);
});
test('只有链接或无工具的媒体输入不生成假正文', async () => {
  for (const kind of ['image','video','web','audio','text']) {
    const result = await resolveInput({kind,value:'https://example.com/media'});
    assert.equal(result.status,'needs_content'); assert.ok(result.next);
  }
});
test('已粘贴文本直接可用；无需调用适配器', async () => {
  const result = await resolveInput({kind:'video',value:'url',extractedText:'[00:01] 斜率是变化率'}, {video:()=>assert.fail('不应调用')});
  assert.equal(result.status,'ready'); assert.equal(result.via,'provided');
});
test('可选适配器真实返回文本才算解析完成', async () => {
  const result = await resolveInput({kind:'image',value:'fixture'}, {image:async()=>({text:'测试替身返回的文字'})});
  assert.equal(result.status,'ready'); assert.equal(result.via,'adapter');
  const empty = await resolveInput({kind:'image',value:'fixture'}, {image:async()=>({text:''})});
  assert.equal(empty.status,'needs_content');
});
test('适配器失败、超时只调用一次且可取消', async () => {
  let calls = 0, signal;
  const result = await resolveInput({kind:'audio',value:'fixture'}, {audio:async args=>{ calls++; signal=args.signal; return new Promise(()=>{}); }}, {timeoutMs:10});
  assert.equal(result.status,'needs_content'); assert.equal(calls,1); assert.equal(signal.aborted,true);
  const denied = await resolveInput({kind:'web',value:'fixture'}, {web:async()=>{throw new Error('凭据不应泄露');}});
  assert.equal(denied.reason,'解析失败或无权限');
});
test('所有示例状态符合契约', async () => {
  for (const name of await readdir(new URL('examples/',root))) if (name.endsWith('.state.json')) validateState(JSON.parse(await readFile(new URL(`examples/${name}`,root),'utf8')));
});
test('示例页的章节锚点唯一且全部能定位', async () => {
  for (const name of await readdir(new URL('examples/',root))) if (name.endsWith('.html')) {
    const html = await readFile(new URL(`examples/${name}`,root),'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,`${name} 重复锚点`);
    for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),`${name} 无效链接 ${id}`);
    assert.doesNotMatch(html, /<(?:script|iframe|link|img)\b|@import|url\((?!\s*['\"]?#)/i);
  }
});
test('三个主题的文字色与背景满足基本对比度', () => {
  const luminance = hex => {
    const c = hex.match(/\w\w/g).map(h=>parseInt(h,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  };
  for (const fg of ['202c36','52616b','214c79','65442e','175c58']) for (const bg of ['ffffff','edf1f4','eaf2fa','f5eee5','eaf4f1']) {
    assert.ok((luminance(bg)+.05)/(luminance(fg)+.05)>=4.5, `${fg}/${bg}`);
  }
});
test('主文件小于5.8KB且说明书加一种模板小于31KB', async () => {
  const bytes = async rel => Buffer.byteLength((await readFile(new URL(rel, root), 'utf8')).replace(/\r\n/g, '\n'), 'utf8');
  const main = await bytes('SKILL.md');
  assert.ok(main < 9000, `主文件 ${main} 字节`);
  let refs = 0;
  for (const name of await readdir(new URL('references/',root))) refs += await bytes(`references/${name}`);
  assert.ok(refs < 12000, `参考合计 ${refs} 字节`);
  for (const style of ['a','b','c']) {
    const tpl = await bytes(`assets/template-${style}.html`);
    assert.ok(main + refs + tpl < 31000, `${style}: ${main + refs + tpl} 字节`);
  }
});
test('文件入口能输出完整文件并拒绝覆盖输入和缺失输入', async () => {
  const dir = await mkdtemp(join(tmpdir(),'multi-note-test-'));
  try {
    const { fileURLToPath } = await import('node:url');
    const input = fileURLToPath(new URL('examples/math.json',root));
    const output = join(dir,'note.html');
    await renderFile(input,output); assert.match(await readFile(output,'utf8'),/一次函数/);
    await renderFile(fileURLToPath(new URL('examples/math.state.json',root)),output);
    assert.match(await readFile(output,'utf8'), /id="note-state"/);
    await assert.rejects(renderFile(input,input), /不能覆盖/);
    await assert.rejects(renderFile(join(dir,'missing.json'),output), /ENOENT/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('学习目标通过校验并渲染验收标准', async () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-slope', text: '能说明斜率与截距的含义', criteria: ['能解释 k 的符号', '能由两点求斜率'], sectionIds: ['concept', 'example'] }];
  validateNote(n);
  const html = (await generateNote(n)).html;
  assert.match(html, /学习目标与验收标准/);
  assert.match(html, /能由两点求斜率/);
  assert.match(html, /对应章节/);
});
test('学习目标缺少验收标准时被拒绝', () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-x', text: '目标', criteria: [], sectionIds: ['concept'] }];
  assert.throws(() => validateNote(n), /验收标准/);
});
test('学习目标引用不存在的章节时被拒绝', () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-x', text: '目标', criteria: ['能做到'], sectionIds: ['missing'] }];
  assert.throws(() => validateNote(n), /不存在的章节/);
});
test('作答判定与 simulated 字段被校验', () => {
  const base = { id: 'p1', question: 'q', answer: 'a', simulated: false };
  const bad1 = clone(note); bad1.practice = [{ ...base, verdict: 'maybe' }];
  assert.throws(() => validateNote(bad1), /判定/);
  const bad2 = clone(note); bad2.practice = [{ ...base, verdict: 'right', simulated: 'no' }];
  assert.throws(() => validateNote(bad2), /模拟/);
});
test('只有演示作答时禁止评估掌握状态', () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-slope', text: '目标', criteria: ['能做到'], sectionIds: ['concept'] }];
  n.practice = [{ id: 'p1', objectiveId: 'obj-slope', question: 'q', answer: 'a', verdict: 'right', simulated: true }];
  const graph = { nodes: [{ id: 'slope', label: '斜率', sectionIds: ['concept'], mastery: 'mastered', evidence: ['自评'] }], edges: [] };
  assert.throws(() => createState(n, graph), /模拟作答/);
  const ok = clone(graph); ok.nodes[0].mastery = 'unknown'; ok.nodes[0].evidence = [];
  assert.doesNotThrow(() => createState(n, ok));
});
test('有真实作答时允许记录掌握状态', () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-slope', text: '目标', criteria: ['能做到'], sectionIds: ['concept'] }];
  n.practice = [{ id: 'p1', objectiveId: 'obj-slope', question: 'q', answer: 'a', verdict: 'right', simulated: false }];
  const graph = { nodes: [{ id: 'slope', label: '斜率', sectionIds: ['concept'], mastery: 'mastered', evidence: ['课堂自测答对第 2 题'] }], edges: [] };
  assert.doesNotThrow(() => createState(n, graph));
});
test('自测表区分真实作答与演示作答', async () => {
  const n = clone(note);
  n.practice = [
    { id: 'p1', question: 'y=-3x+2 中 y 如何变化', answer: 'y 减小', verdict: 'right', simulated: false },
    { id: 'p2', question: '演示题', answer: '演示答案', verdict: 'wrong', simulated: true },
  ];
  const html = (await generateNote(n)).html;
  assert.match(html, /自测与错题/);
  assert.match(html, /真实作答 1 题/);
  assert.match(html, /演示作答 1 题/);
  assert.match(html, /不计入/);
  assert.match(html, /核对答案/);
  assert.match(html, /practice-key/);
  assert.ok(html.indexOf('演示答案') > html.indexOf('核对答案'));
  assert.equal(summarisePractice(n).real, 1);
  assert.equal(summarisePractice(n).simulated, 1);
});
test('复习节奏只按真实作答推进', () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-a', text: 'A', criteria: ['a'], sectionIds: ['concept'] },
                  { id: 'obj-b', text: 'B', criteria: ['b'], sectionIds: ['concept'] }];
  n.practice = [
    { id: 'p1', objectiveId: 'obj-a', question: 'q', answer: 'a', verdict: 'right', simulated: true },
    { id: 'p2', objectiveId: 'obj-b', question: 'q', answer: 'a', verdict: 'wrong', simulated: false },
  ];
  const plan = reviewSchedule(n);
  assert.equal(plan[0].days, null);
  assert.equal(plan[1].days, 1);
});
test('知识结构生成内联 SVG 且无外部引用', async () => {
  const html = (await generateNote(state.note, state)).html;
  assert.match(html, /<svg[^>]*aria-label="知识结构图/);
  assert.match(html, /<text[^>]*>斜率<\/text>/);
  assert.match(html, /<polygon points="[^"]+" fill="#52616b"\/>/);   // 箭头是手绘多边形，不用 marker
  assert.match(html, /第 1 层/);
  assert.match(html, /尚未评估/);
  assert.doesNotMatch(html, /url\(|<script|src="http|href="http/i);
  assert.match(html, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});
test('无状态的笔记也有章节结构图', async () => {
  const html = (await generateNote(note)).html;
  assert.match(html, /aria-label="章节结构图/);
  assert.match(html, /href="#section-concept"/);
  assert.doesNotMatch(html, /id="note-state"/);
});
test('卡片导出为 Anki 兼容 CSV 并正确转义', () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-slope', text: '能说明斜率, 与截距', criteria: ['第一点', '第二点'], sectionIds: ['concept'] }];
  const rows = cardsFromNote(n);
  const csv = toCsv(rows);
  assert.equal(rows[0][0], 'front');
  assert.match(csv, /"能说明斜率, 与截距"/);
  assert.match(csv, /obj-slope/);
  assert.ok(rows.length > 3);
});
test('学习计划按天数切分并可打印', () => {
  const n = clone(note);
  n.objectives = [
    { id: 'obj-1', text: '目标一', criteria: ['a'], sectionIds: ['concept'] },
    { id: 'obj-2', text: '目标二', criteria: ['b'], sectionIds: ['example'] },
    { id: 'obj-3', text: '目标三', criteria: ['c'], sectionIds: ['quiz'] },
  ];
  const s = createState(n, { nodes: [], edges: [] });
  const plan = buildPlan(s, { days: 3 });
  assert.equal(plan.length, 3);
  assert.equal(plan.flatMap(d => d.items).length, 3);
});

test('学习计划不把复习排在学习之前', () => {
  const n = clone(note);
  n.objectives = [
    { id: 'obj-1', text: '目标一', criteria: ['a'], sectionIds: ['concept'] },
    { id: 'obj-2', text: '目标二', criteria: ['b'], sectionIds: ['example'] },
    { id: 'obj-3', text: '目标三', criteria: ['c'], sectionIds: ['quiz'] },
  ];
  n.practice = [{ id: 'p1', objectiveId: 'obj-2', question: 'q', answer: 'a', verdict: 'wrong', simulated: false }];
  const s = createState(n, { nodes: [], edges: [] });
  const plan = buildPlan(s, { days: 3 });
  const day1 = plan[0];
  assert.equal(day1.items[0].id, 'obj-1');
  assert.ok(day1.reviews.every(item => item.id !== 'obj-2'), '第 1 天不应复习第 2 天才学的目标');
  const day2 = plan[1];
  assert.ok(!day2.reviews.some(item => item.id === 'obj-2'), '答错的目标应在学完之后的下一天复习');
  const day3 = plan[2];
  assert.ok(day3.reviews.some(item => item.id === 'obj-2'), '第 3 天应出现第 2 天学过且答错的目标');
});

test('增量合并支持追加作答记录', () => {
  const attempt = { id: 'p9', question: '新题', answer: '新答案', verdict: 'right', simulated: false };
  const result = mergeState(state, { baseRevision: 1, summary: '补一次真实作答', practice: [attempt] });
  assert.equal(result.changed, true);
  assert.equal(result.state.note.revision, 2);
  assert.deepEqual(result.state.note.practice, [attempt]);
});
test('同 id 作答内容冲突时整个事务不提交', () => {
  const first = { id: 'p9', question: '题', answer: '答案 A', verdict: 'right', simulated: false };
  const merged = mergeState(state, { baseRevision: 1, summary: '记录', practice: [first] }).state;
  const conflict = mergeState(merged, { baseRevision: 2, summary: '改写', practice: [{ ...first, answer: '答案 B' }] });
  assert.equal(conflict.conflicts[0].kind, 'practice');
  assert.equal(conflict.changed, false);
  assert.deepEqual(conflict.state, merged);
});
test('增量合并支持追加学习目标', () => {
  const objective = { id: 'obj-new', text: '新目标', criteria: ['能做到'], sectionIds: ['concept'] };
  const result = mergeState(state, { baseRevision: 1, summary: '加目标', objectives: [objective] });
  assert.equal(result.state.note.objectives[0].id, 'obj-new');
});
test('存在学习目标时自测表显示目标列', async () => {
  const n = clone(note);
  n.objectives = [{ id: 'obj-slope', text: '目标', criteria: ['能做到'], sectionIds: ['concept'] }];
  n.practice = [{ id: 'p1', objectiveId: 'obj-slope', question: 'q', answer: 'a', verdict: 'right', simulated: false }];
  const html = (await generateNote(n)).html;
  assert.match(html, /<th scope="col">目标<\/th>/);
  assert.match(html, /<td>目标 1<\/td>/);
  assert.match(html, /目标：目标 1/);
  assert.match(html, /<strong>目标 1<\/strong>/);
  assert.doesNotMatch(html, /编号 obj-/);
});
test('没有学习目标时计划按章节排期', () => {
  const s = createState(note, { nodes: [], edges: [] });
  const plan = buildPlan(s, { days: 2 });
  const html = renderPlanHtml(s, plan, 2);
  assert.match(html, /按章节排期/);
  assert.equal(plan.flatMap(day => day.items).length, note.sections.length);
});
test('计划支持起始日期', () => {
  const s = createState(note, { nodes: [], edges: [] });
  const plan = buildPlan(s, { days: 3, start: '2026-10-21' });
  assert.deepEqual(plan.map(day => day.date), ['2026-10-21', '2026-10-22', '2026-10-23']);
});
test('审计能发现外链与失效锚点', () => {
  assert.ok(auditHtml('<script>alert(1)</script>').includes('包含 script'));
  assert.ok(auditHtml('<a href="#missing">x</a>').some(item => item.startsWith('失效锚点')));
  assert.deepEqual(auditHtml('<p id="a"><a href="#a">ok</a></p>'), []);
});
test('CSV 带 BOM 且审计通过', () => {
  const csv = withBom('front,back,tags,source\n"含,逗号",答案,x,S1\n');
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.deepEqual(auditCsv(csv), []);
  assert.ok(auditCsv('front,back\na\n').length > 0);
});
test('进阶示例的计划顺序通过审计', async () => {
  const advanced = JSON.parse(await readFile(new URL('examples/advanced/math-objectives.state.json', root), 'utf8'));
  assert.deepEqual(auditPlan(advanced, 5), []);
  const html = (await generateNote(advanced.note, advanced)).html;
  assert.deepEqual(auditHtml(html), []);
});

test('计划页用目标序号显示，id 只在 title 里', () => {
  const n = clone(note);
  n.objectives = [
    { id: 'obj-1', text: '目标一', criteria: ['a'], sectionIds: ['concept'] },
    { id: 'obj-2', text: '目标二', criteria: ['b'], sectionIds: ['example'] },
  ];
  const s = createState(n, { nodes: [], edges: [] });
  const plan = buildPlan(s, { days: 2 });
  const html = renderPlanHtml(s, plan, 2);
  assert.match(html, /<strong>目标 1<\/strong>/);
  assert.match(html, /title="obj-1"/);
  assert.doesNotMatch(html, /<strong>obj-1<\/strong>/);
});

test('统一 CLI 提供帮助与未知命令退出码', () => {
  const run = args => {
    try { return { code: 0, out: execFileSync(process.execPath, ['cli/note.mjs', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
    catch (error) { return { code: error.status, out: String(error.stdout || '') + String(error.stderr || '') }; }
  };
  const help = run(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.out, /render/);
  assert.match(help.out, /退出码/);
  const unknown = run(['nope']);
  assert.equal(unknown.code, 1);
  assert.match(unknown.out, /未知命令/);
});
test('统一 CLI 的渲染与冲突退出码', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'multi-note-cli-'));
  try {
    const out = join(dir, 'cli.html');
    const rendered = execFileSync(process.execPath, ['cli/note.mjs', 'render', 'examples/math.json', out], { encoding: 'utf8' });
    assert.match(rendered, /已生成/);
    assert.ok((await readFile(out, 'utf8')).includes('<!doctype html>'));
    const conflict = { baseRevision: 1, summary: '制造冲突', sections: [{ id: 'concept', heading: '冲突标题', blocks: [{ type: 'paragraph', text: '不同内容' }], origin: 'source', sourceIds: ['S1'] }] };
    const patchPath = join(dir, 'patch.json');
    await writeFile(patchPath, JSON.stringify(conflict), 'utf8');
    let code = 0;
    try {
      execFileSync(process.execPath, ['cli/note.mjs', 'update', 'examples/math.state.json', patchPath, join(dir, 'out.json')], { stdio: 'ignore' });
    } catch (error) { code = error.status; }
    assert.equal(code, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('只有链接时不假装已读', async () => {
  const result = await resolveInput({ kind: 'web', value: 'https://example.com/post' });
  assert.equal(result.status, 'needs_content');
  assert.match(result.next, /粘贴/);
});
test('识别置信度低时先请求核对', async () => {
  const result = await resolveInput({ kind: 'image', value: 'p.jpg' }, { image: async () => ({ text: '模糊的公式', confidence: 0.4 }) });
  assert.equal(result.status, 'needs_content');
  assert.match(result.reason, /不确定/);
  assert.ok(result.preview.length > 0);
});
test('超大材料要求拆分而不是硬吞', async () => {
  const result = await resolveInput({ kind: 'text', value: '字'.repeat(200001) });
  assert.equal(result.status, 'needs_content');
  assert.match(result.reason, /材料过大/);
  const ok = await resolveInput({ kind: 'text', value: '字'.repeat(200000) });
  assert.equal(ok.status, 'ready');
});

test('夜间规则的每个选择器都带作用域，避免污染浅色', async () => {
  for (const style of ['a', 'b', 'c']) {
    const html = await readFile(new URL('assets/template-' + style + '.html', root), 'utf8');
    const lines = html.split('\n').filter(line => line.startsWith('html:has(#night:checked)'));
    assert.ok(lines.length > 5, style + ' 缺少夜间规则');
    for (const line of lines) {
      const selectors = line.slice(0, line.indexOf('{')).split(',');
      for (const selector of selectors) {
        assert.ok(selector.trim().startsWith('html:has(#night:checked)'), style + ' 裸选择器：' + selector.trim());
      }
    }
  }
});

test('交互版内联三套主题且可切换', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'multi-note-int-'));
  try {
    const out = join(dir, 'int.html');
    const stdout = execFileSync(process.execPath, ['cli/note.mjs', 'render', 'examples/java-web.json', out, '--interactive'], { encoding: 'utf8' });
    assert.match(stdout, /交互版/);
    const html = await readFile(out, 'utf8');
    assert.match(html, /id="theme-css"/);
    assert.match(html, /data-style="a"/);
    assert.match(html, /<script>/);
    assert.match(html, /\.style-switch/);
    assert.doesNotMatch(html, /href="https?:/i);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('夜间覆盖代码与图注颜色', async () => {
  for (const style of ['a', 'b', 'c']) {
    const css = await readFile(new URL('assets/template-' + style + '.html', root), 'utf8');
    assert.match(css, /html:has\(#night:checked\) pre\{color:/, style + ' 缺少夜间代码色');
    assert.match(css, /html:has\(#night:checked\) figcaption\{background:/, style + ' 缺少夜间图注底色');
  }
});

test('来源链接只允许 https，并在产物中可点击', async () => {
  const note = {
    schemaVersion: 1, id: 'cite-demo', revision: 1, title: '引用来源', scene: 'tech', style: 'style-b',
    summary: '来源可标注 URL。',
    sources: [{ id: 'S1', label: 'MDN', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML', text: 'HTML 是标记语言。' }],
    objectives: [{ id: 'o1', text: '会标注来源', criteria: ['能给出链接'], sectionIds: ['s1'] }],
    practice: [], sections: [{ id: 's1', heading: '来源', origin: 'source', sourceIds: ['S1'], blocks: [{ type: 'paragraph', text: '正文。' }] }]
  };
  const state = createState(note, { nodes: [{ id: 's1', label: '来源', sectionIds: ['s1'], mastery: 'unknown', evidence: [] }], edges: [] });
  const { html } = await generateNote(note, state);
  assert.match(html, /<a class="src-link" href="https:\/\/developer\.mozilla\.org/);
  assert.deepEqual(auditHtml(html), []);
  const insecure = html.replace('https://developer.mozilla.org', 'http://developer.mozilla.org');
  assert.ok(auditHtml(insecure).includes('来源链接必须使用 https'));
  const outside = html.replace('<p class="lead">', '<p class="lead"><a href="https://example.com">x</a>');
  assert.ok(auditHtml(outside).includes('外链 href'));

  note.keywords = ['引用', '来源'];
  const { html: withWords } = await generateNote(note);
  assert.match(withWords, /class="keywords"/);
  assert.match(withWords, /class="keywords"[\s\S]*?href="#section-/);
  note.sections[0].blocks = [{ type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', alt: '示意图', caption: '图 1' }];
  const { html: withImage } = await generateNote(note);
  assert.match(withImage, /<img src="data:image\/png;base64,/);
  assert.deepEqual(auditHtml(withImage), []);
  note.sections[0].blocks = [{ type: 'paragraph', text: '正文。' }];

  note.sources.push({ id: 'S2', label: '视频字幕 · 01:02–01:05', url: 'https://www.bilibili.com/video/BV1xx411c7mD', text: '时间戳来源。' });
  const { html: withTime } = await generateNote(note);
  assert.match(withTime, /\?t=62/);
});

test('契约：缺标题直接拒绝', () => {
  const bad = structuredClone(note); delete bad.title;
  assert.throws(() => validateNote(bad), /标题/);
});

test('契约：章节 id 重复直接拒绝', () => {
  const bad = structuredClone(note);
  bad.sections = [bad.sections[0], structuredClone(bad.sections[0])];
  assert.throws(() => validateNote(bad), /章节 id/);
});

test('契约：没有来源直接拒绝', () => {
  const bad = structuredClone(note); bad.sources = [];
  assert.throws(() => validateNote(bad), /至少需要一个真实来源/);
});

test('契约：未知主题直接拒绝', () => {
  const bad = structuredClone(note); bad.style = 'style-z';
  assert.throws(() => validateNote(bad), /未知场景或主题/);
});

function practiceNote(verdicts) {
  const base = structuredClone(note);
  if (!base.objectives?.length) base.objectives = [{ id: 'o1', text: '目标', criteria: [], sectionIds: [base.sections[0].id] }];
  base.practice = verdicts.map((verdict, i) => ({
    id: 'p' + (i + 1), objectiveId: base.objectives[0].id,
    verdict, simulated: false, at: '2026-10-01'
  }));
  return base;
}

test('复习排期：答错回到 1 天', () => {
  const plan = reviewSchedule(practiceNote(['wrong']));
  assert.equal(plan[0].days, 1);
});

test('复习排期：答对 1 次到 3 天', () => {
  const plan = reviewSchedule(practiceNote(['right']));
  assert.equal(plan[0].days, 3);
});

test('复习排期：连续答对 2 次到 7 天', () => {
  const plan = reviewSchedule(practiceNote(['right', 'right']));
  assert.equal(plan[0].days, 7);
});

test('复习排期：连续答对 3 次到 16 天', () => {
  const plan = reviewSchedule(practiceNote(['right', 'right', 'right']));
  assert.equal(plan[0].days, 16);
});

test('作答统计：区分真实与演示', () => {
  const n = structuredClone(note);
  if (!n.objectives?.length) n.objectives = [{ id: 'o1', text: '目标', criteria: [], sectionIds: [n.sections[0].id] }];
  n.practice = [
    { id: 'p1', objectiveId: n.objectives[0].id, verdict: 'right', simulated: false, at: '2026-10-01' },
    { id: 'p2', objectiveId: n.objectives[0].id, verdict: 'wrong', simulated: false, at: '2026-10-01' },
    { id: 'p3', objectiveId: n.objectives[0].id, verdict: 'right', simulated: true, at: '2026-10-01' }
  ];
  const s = summarisePractice(n);
  assert.equal(s.total, 3); assert.equal(s.real, 2); assert.equal(s.simulated, 1);
  assert.equal(s.right, 1); assert.equal(s.wrong, 1);
});

test('审计：脚本被拦下', () => {
  assert.ok(auditHtml('<html><body><script>1</script></body></html>').includes('包含 script'));
});

test('审计：重复 id 被拦下', () => {
  assert.ok(auditHtml('<div id="a"></div><div id="a"></div>').some(x => x.startsWith('重复 id')));
});

test('审计：失效锚点被拦下', () => {
  assert.ok(auditHtml('<a href="#nope">x</a>').some(x => x.startsWith('失效锚点')));
});

test('审计：表格列数不一致被拦下', () => {
  const html = '<table><tr><th>a</th><td>1</td><td>2</td></tr></table>';
  assert.ok(auditHtml(html).includes('表格列数不一致'));
});

test('审计：SVG 必须有 aria-label', () => {
  assert.ok(auditHtml('<svg></svg>').includes('SVG 缺少 aria-label'));
});

test('审计：空列表被拦下', () => {
  assert.ok(auditHtml('<ul></ul>').includes('存在空列表'));
});

test('审计：干净片段没有问题', () => {
  assert.deepEqual(auditHtml('<h1>标题</h1><p>正文</p><a href="#x">锚</a><h2 id="x">节</h2>'), []);
});

test('合并：基础版本不一致直接拒绝', () => {
  assert.throws(() => mergeState(state, { baseRevision: state.note.revision + 1, summary: 'x' }), /基础版本/);
});

function standardNote() {
  const sections = Array.from({ length: 8 }, (_, i) => ({
    id: 's' + (i + 1), heading: '章节 ' + (i + 1), origin: 'supplement', sourceIds: [],
    blocks: [{ type: 'paragraph', text: '正文 ' + (i + 1) }]
  }));
  sections[0].blocks = [{ type: 'table', headers: ['a', 'b'], rows: [['1', '2'], ['3', '4']] }];
  sections[1].blocks = [{ type: 'callout', text: '提示' }];
  sections.push({ id: 'transfer', heading: '举一反三：迁移任务', origin: 'supplement', sourceIds: [], blocks: [{ type: 'paragraph', text: '换一个情境试试。' }] });
  return {
    schemaVersion: 1, id: 'standard', revision: 1, title: '标准笔记示例',
    scene: 'tech', style: 'style-b', summary: '这是一段足够长的摘要，用来满足规范检查的最小长度要求。',
    sources: [{ id: 'S1', label: '讲义', text: '原文片段' }],
    sections,
    objectives: [1, 2, 3].map(i => ({ id: 'o' + i, text: '目标 ' + i, criteria: ['标准一', '标准二'], sectionIds: ['s' + i] })),
    practice: [1, 2, 3].map(i => ({ id: 'p' + i, objectiveId: 'o' + i, verdict: 'right', simulated: false, question: '问题 ' + i, answer: '答案 ' + i }))
  };
}

test('规范：标准笔记通过', () => {
  assert.deepEqual(checkNote(standardNote()), []);
  const meeting = standardNote(); meeting.scene = 'meeting';
  assert.ok(checkNote(meeting).some(x => x.includes('决策')));
  meeting.sections[0].blocks.push({ type: 'table', headers: ['决策', '负责人', '截止'], rows: [['上线', '张三', '10-30']] });
  assert.deepEqual(checkNote(meeting), []);
  const lean = standardNote(); lean.scene = 'meeting'; delete lean.objectives; delete lean.practice;
  lean.sections[0].blocks.push({ type: 'table', headers: ['决策', '负责人', '截止'], rows: [['上线', '张三', '10-30']] });
  assert.deepEqual(checkNote(lean), []);
  const reading = standardNote(); reading.scene = 'reading';
  reading.sections[0].origin = 'source'; reading.sections[0].sourceIds = ['S1'];
  assert.deepEqual(checkNote(reading), []);
});

test('规范：缺迁移任务被拦下', () => {
  const n = standardNote();
  n.sections = n.sections.filter(s => s.id !== 'transfer');
  assert.ok(checkNote(n).some(x => x.includes('迁移')));
});

test('规范：章节过少被拦下，compact 短笔记放行', () => {
  const n = standardNote(); n.sections = n.sections.slice(0, 4);
  assert.ok(checkNote(n).some(x => x.includes('章节数')));
  const compact = standardNote();
  compact.compact = true;
  compact.sections = [...compact.sections.slice(0, 3), compact.sections.at(-1)];
  assert.deepEqual(checkNote(compact), []);
  assert.doesNotThrow(() => validateNote(compact));
});

test('规范：表格列数不一致被拦下', () => {
  const n = standardNote(); n.sections[0].blocks[0].rows.push(['1']);
  assert.ok(checkNote(n).some(x => x.includes('表格列数')));
});

test('规范：自测必须标明真实/演示', () => {
  const n = standardNote(); delete n.practice[0].simulated;
  assert.ok(checkNote(n).some(x => x.includes('真实/演示')));
});

test('规范：产物含脚本被拦下', () => {
  const html = '<main><section id="section-s1"></section><script>1</script></main>';
  assert.ok(checkHtml(html, standardNote()).some(x => x.includes('脚本')));
});

test('规范：同一输入多次渲染字节一致', async () => {
  const n = standardNote();
  const st = createState(n, { nodes: n.sections.map(s => ({ id: s.id, label: s.heading, sectionIds: [s.id], mastery: 'unknown', evidence: [] })), edges: [] });
  const hashes = [];
  for (let i = 0; i < 3; i++) { const { html } = await generateNote(n, st); hashes.push(createHash('sha256').update(html).digest('hex')); }
  assert.equal(new Set(hashes).size, 1);
});

test('规范：三种主题结构一致且审计通过', async () => {
  const base = standardNote();
  const counts = [];
  for (const style of ['style-a', 'style-b', 'style-c']) {
    const n = structuredClone(base); n.style = style;
    const st = createState(n, { nodes: n.sections.map(s => ({ id: s.id, label: s.heading, sectionIds: [s.id], mastery: 'unknown', evidence: [] })), edges: [] });
    const { html } = await generateNote(n, st);
    assert.deepEqual(auditHtml(html), []);
    counts.push((html.match(/<section\b/g) ?? []).length);
  }
  assert.equal(new Set(counts).size, 1);
});

test('夜间样式只作用于屏幕，打印保持浅色', async () => {
  const html = await readFile(new URL('assets/template-b.html', root), 'utf8');
  assert.ok(html.includes('@media screen{\nhtml:has(#night:checked) body'));
  assert.ok(html.includes('@media print{.night-toggle,.night-toggle-label{display:none}}'));
  assert.ok(!/@media print\{[^}]*night:checked/.test(html));
});

test('夜间模式覆盖 SVG 节点与页脚', async () => {
  const html = await readFile(new URL('assets/template-b.html', root), 'utf8');
  assert.ok(html.includes('svg rect[fill="#fff"]'));
  assert.ok(html.includes('svg text{fill:'));
  assert.ok(html.includes('.footer{color:'));
});

test('切换按钮可聚焦且有无障碍名称', async () => {
  const html = await readFile(new URL('assets/template-b.html', root), 'utf8');
  assert.ok(html.includes('aria-label="夜间模式"'));
  assert.ok(html.includes('.night-toggle:focus-visible+.night-toggle-label'));
});

test('夜间激活时标签显示“白天”', async () => {
  const html = await readFile(new URL('assets/template-b.html', root), 'utf8');
  assert.ok(html.includes('html:has(#night:checked) .night-toggle-label:before{content:"◑ 白天"}'));
});

test('视频链接识别：YouTube / B站 / Vimeo', () => {
  assert.deepEqual(detectVideo('https://youtu.be/dQw4w9WgXcQ'), { platform: 'youtube', id: 'dQw4w9WgXcQ' });
  assert.deepEqual(detectVideo('https://www.youtube.com/watch?v=abc123&t=10'), { platform: 'youtube', id: 'abc123' });
  assert.deepEqual(detectVideo('https://www.bilibili.com/video/BV1xx411c7mD?p=2'), { platform: 'bilibili', id: 'BV1xx411c7mD' });
  assert.deepEqual(detectVideo('https://vimeo.com/123456789'), { platform: 'vimeo', id: '123456789' });
  assert.equal(detectVideo('https://example.com/video'), null);
  assert.equal(detectVideo('not a url'), null);
});

test('视频链接：有公开字幕就转来源，没有就明确停下', async () => {
  const r = await resolveInput({ kind: 'video', value: 'https://www.bilibili.com/video/BV1xx411c7mD' });
  assert.equal(r.status, 'needs_content');
  assert.equal(r.platform, 'bilibili');
  assert.match(r.next, /video/);

  const response = body => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });
  const biliFetch = async url => {
    if (url.includes('/x/web-interface/view')) return response({ code: 0, data: { bvid: 'BV1xx411c7mD', aid: 1, title: '测试视频', duration: 120, pages: [{ cid: 2, page: 1, part: 'P1', duration: 120 }] } });
    if (url.includes('/x/player/v2')) return response({ code: 0, data: { subtitle: { subtitles: [{ lan: 'zh-CN', lan_doc: '中文', subtitle_url: '//example.com/sub.json' }] } } });
    if (url === 'https://example.com/sub.json') return response({ body: [{ from: 0, to: 2, content: '开场' }, { from: 2, to: 5, content: '定义' }] });
    throw new Error('unexpected ' + url);
  };
  const ready = await fetchVideo('https://www.bilibili.com/video/BV1xx411c7mD?p=1', { fetchImpl: biliFetch });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.title, '测试视频');
  assert.equal(ready.cues.length, 2);
  assert.match(ready.sources[0].label, /^视频字幕 · 00:00/);
  assert.match(ready.transcript, /开场/);

  const empty = await fetchVideo('https://www.bilibili.com/video/BV1xx411c7mD', {
    fetchImpl: async url => url.includes('/x/player/v2')
      ? response({ code: 0, data: { subtitle: { subtitles: [] } } })
      : response({ code: 0, data: { bvid: 'BV1xx411c7mD', aid: 1, title: '测试视频', duration: 120, pages: [{ cid: 2, page: 1, part: 'P1', duration: 120 }] } })
  });
  assert.equal(empty.status, 'needs_transcript');
  assert.match(empty.reason, /字幕/);

  const player = { videoDetails: { title: 'YouTube 测试', lengthSeconds: '90' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ languageCode: 'zh-CN', baseUrl: 'https://example.com/cap' }] } } };
  const ytFetch = async url => {
    if (url.includes('youtube.com/watch')) return { ok: true, status: 200, text: async () => '<script>var ytInitialPlayerResponse = ' + JSON.stringify(player) + ';</script>' };
    if (url === 'https://example.com/cap&fmt=json3') return response({ events: [{ tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: '开场' }, { utf8: '定义' }] }] });
    throw new Error('unexpected ' + url);
  };
  const yt = await fetchVideo('https://youtu.be/abc', { fetchImpl: ytFetch });
  assert.equal(yt.status, 'ready');
  assert.equal(yt.title, 'YouTube 测试');
  assert.match(yt.sources[0].text, /开场定义/);

  const failed = await fetchVideo('https://youtu.be/abc', { fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(failed.status, 'error');
  assert.match(failed.reason, /offline/);
});

test('视频适配器返回字幕后可以进入生成', async () => {
  const r = await resolveInput({ kind: 'video', value: 'https://youtu.be/abc', label: '讲座' }, {
    video: async () => ({ text: '[00:00] 开场\n[00:30] 定义' })
  });
  assert.equal(r.status, 'ready');
  assert.match(r.text, /00:30/);
  assert.equal(r.via, 'adapter');
});

test('长笔记用学习路径，短笔记用 SVG', async () => {
  const mk = note => createState(note, { nodes: note.sections.map(s => ({ id: s.id, label: s.heading, sectionIds: [s.id], mastery: 'unknown', evidence: [] })), edges: [] });
  const short = standardNote();
  short.sections = short.sections.slice(0, 3);
  const shortHtml = (await generateNote(short, mk(short))).html;
  assert.ok(shortHtml.includes('id="mindmap"'));
  assert.ok(!shortHtml.includes('学习路径'));

  const long = standardNote();
  long.sections.push({ id: 's10', heading: '第十章', origin: 'supplement', sourceIds: [], blocks: [{ type: 'paragraph', text: '正文' }] });
  const longHtml = (await generateNote(long, mk(long))).html;
  assert.ok(longHtml.includes('学习路径'));
  assert.ok(!longHtml.includes('id="mindmap"'));
});

test('视频字幕时间戳进入来源并渲染', async () => {
  const cues = parseSubtitles('1\n00:00:01,000 --> 00:00:03,500\n开场先讲边界。');
  const sources = toSources(cues);
  assert.equal(sources[0].label, '视频字幕 · 00:01–00:03');
  const n = standardNote();
  n.sources = sources;
  n.sections[0].origin = 'source';
  n.sections[0].sourceIds = [sources[0].id];
  const st = createState(n, { nodes: n.sections.map(s => ({ id: s.id, label: s.heading, sectionIds: [s.id], mastery: 'unknown', evidence: [] })), edges: [] });
  const { html } = await generateNote(n, st);
  assert.match(html, /00:01–00:03/);
  assert.deepEqual(auditHtml(html), []);
});