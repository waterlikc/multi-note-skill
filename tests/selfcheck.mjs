import { readFile, readdir, stat, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const results = [];
const add = (name, ok, detail = '') => results.push({ name, ok, detail });

async function size(rel) { return (await stat(new URL(rel, root))).size; }
async function list(dir) { return readdir(new URL(dir, root)); }

// 1. 预算
const textBytes = async rel => Buffer.byteLength((await readFile(new URL(rel, root), 'utf8')).replace(/\r\n/g, '\n'), 'utf8');
const skill = await textBytes('SKILL.md');
let refs = 0;
for (const f of await readdir(new URL('references/', root))) refs += await textBytes('references/' + f);
let maxTpl = 0;
for (const f of await list('assets/')) if (f.startsWith('template-')) maxTpl = Math.max(maxTpl, await textBytes('assets/' + f));
add('SKILL.md < 9,000', skill < 9000, skill + ' 字节');
add('参考 < 12,000', refs < 12000, refs + ' 字节');
add('单模板 < 10,000', maxTpl < 10000, maxTpl + ' 字节');
add('合计 < 31,000', skill + refs + maxTpl < 31000, (skill + refs + maxTpl) + ' 字节');

// 2. 测试
const tests = spawnSync(process.execPath, ['--test', 'tests/runtime.test.mjs', 'tests/animation.test.mjs'], { cwd: rootPath, encoding: 'utf8' });
add('测试全绿', tests.status === 0, (tests.stdout.match(/pass (\d+)/) || [])[1] + ' 项');

// 3. CLI
const cli = args => spawnSync(process.execPath, ['cli/note.mjs', ...args], { cwd: rootPath, encoding: 'utf8' });
const help = cli(['--help']);
add('CLI 帮助', help.status === 0 && /render/.test(help.stdout) && /审计/.test(help.stdout));
const unknown = cli(['nope']);
add('未知命令退出码 1', unknown.status === 1);

// 4. 渲染与冲突
const dir = await mkdtemp(join(tmpdir(), 'selfcheck-'));
try {
  const out = join(dir, 'note.html');
  const rendered = cli(['render', 'examples/java-web.json', out]);
  const html = rendered.status === 0 ? await readFile(out, 'utf8') : '';
  add('渲染可读', rendered.status === 0 && html.startsWith('<!doctype html>'));
  add('无脚本/外链', !/<script|<iframe|<link\b|src="https?:/i.test(html));
  const conflict = { baseRevision: 1, summary: '冲突', sections: [{ id: 'concept', heading: '不同标题', blocks: [{ type: 'paragraph', text: 'x' }], origin: 'source', sourceIds: ['S1'] }] };
  const patch = join(dir, 'p.json');
  await (await import('node:fs/promises')).writeFile(patch, JSON.stringify(conflict), 'utf8');
  const dup = cli(['update', 'examples/math.state.json', patch, join(dir, 'o.json')]);
  add('冲突退出码 2', dup.status === 2);
} finally { await rm(dir, { recursive: true, force: true }); }

// 5. 审计
const audit = cli(['audit']);
add('产物审计', audit.status === 0);

// 6. 旧入口
const legacy = spawnSync(process.execPath, ['scripts/render.mjs', 'examples/java-web.json', join(tmpdir(), 'legacy-' + Date.now() + '.html')], { cwd: rootPath, encoding: 'utf8' });
add('旧命令兼容', legacy.status === 0);

// 7. 构建幂等
const hash = async () => {
  const h = createHash('sha256');
  for (const f of (await list('examples/')).sort()) {
    if (!f.endsWith('.html')) continue;
    h.update(f); h.update(await readFile(new URL('examples/' + f, root)));
  }
  return h.digest('hex').slice(0, 12);
};
const before = await hash();
spawnSync(process.execPath, ['tools/build.mjs'], { cwd: rootPath, encoding: 'utf8' });
const after = await hash();
add('构建幂等', before === after, before);

// 8. 文档链接
const skillText = await readFile(new URL('SKILL.md', root), 'utf8');
const refsLinks = [...skillText.matchAll(/\(references\/([\w.-]+\.md)\)/g)].map(m => m[1]);
let missing = [];
for (const f of refsLinks) { try { await stat(new URL('references/' + f, root)); } catch { missing.push(f); } }
add('SKILL 内链接有效', missing.length === 0, refsLinks.length + ' 条');


// 9. 渲染确定性与样式能力
const detA = join(tmpdir(), 'det-a-' + Date.now() + '.html');
const detB = join(tmpdir(), 'det-b-' + Date.now() + '.html');
cli(['render', 'examples/java-web.json', detA]);
cli(['render', 'examples/java-web.json', detB]);
const detHtml = await readFile(detA, 'utf8');
add('两次渲染字节一致', detHtml === await readFile(detB, 'utf8'));
add('打印样式存在', /@media\s+print/.test(detHtml));
add('夜间开关存在', /id="night"/.test(detHtml));
const secCount = (detHtml.match(/<section\b/g) || []).length;
add('章节数与源一致', secCount >= 7, secCount + ' 段');

// 10. 审计拦截三类坏产物
const badDir1 = await mkdtemp(join(tmpdir(), 'selfcheck-bad-'));
try {
  const base = JSON.parse(await readFile(new URL('examples/java-web.json', root), 'utf8'));
  const httpNote = JSON.parse(JSON.stringify(base));
  httpNote.sources = [{ id: 'S1', label: '来源', text: '来源改 http', url: 'http://example.com/a' }];
  for (const sec of httpNote.sections) { sec.sourceIds = ['S1']; sec.origin = 'source'; }
  const notePath = join(badDir1, 'note.json');
  await (await import('node:fs/promises')).writeFile(notePath, JSON.stringify(httpNote), 'utf8');
  cli(['render', notePath, join(badDir1, 'note.html')]);
  add('拦截 http 来源', cli(['audit', badDir1]).status === 1);

  const imgPath = join(badDir1, 'note.html');
  const html = await readFile(imgPath, 'utf8');
  await (await import('node:fs/promises')).writeFile(imgPath, html.replace('</body>', '<img src=https://example.com/x.png></body>'), 'utf8');
  add('拦截外链图片', cli(['audit', badDir1]).status === 1);
} finally { await rm(badDir1, { recursive: true, force: true }); }

// 11. 契约拒绝坏输入
const badDir = await mkdtemp(join(tmpdir(), 'selfcheck-bad2-'));
try {
  const base = JSON.parse(await readFile(new URL('examples/java-web.json', root), 'utf8'));
  const badTable = JSON.parse(JSON.stringify(base));
  badTable.sections[0].blocks.push({ type: 'table', headers: ['a', 'b'], rows: [['只有一列']] });
  const p1 = join(badDir, 't.json');
  await (await import('node:fs/promises')).writeFile(p1, JSON.stringify(badTable), 'utf8');
  add('拒收列数不一致的表', cli(['render', p1, join(badDir, 'o1.html')]).status === 1);

  const badId = JSON.parse(JSON.stringify(base));
  badId.id = '坏 id';
  const p2 = join(badDir, 'i.json');
  await (await import('node:fs/promises')).writeFile(p2, JSON.stringify(badId), 'utf8');
  add('拒收非法 id', cli(['render', p2, join(badDir, 'o2.html')]).status === 1);
} finally { await rm(badDir, { recursive: true, force: true }); }

// 输出
let bad = 0;
for (const r of results) { if (!r.ok) bad++; console.log((r.ok ? '✓ ' : '✗ ') + r.name + (r.detail ? '  ' + r.detail : '')); }
console.log(bad ? '自检未通过：' + bad + ' 项' : '自检通过：' + results.length + ' 项');
process.exitCode = bad ? 1 : 0;
