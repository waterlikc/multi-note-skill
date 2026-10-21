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
const skill = await size('SKILL.md');
let refs = 0;
for (const f of await readdir(new URL('references/', root))) refs += (await stat(new URL('references/' + f, root))).size;
let maxTpl = 0;
for (const f of await list('assets/')) if (f.startsWith('template-')) maxTpl = Math.max(maxTpl, await size('assets/' + f));
add('SKILL.md < 5,000', skill < 5000, skill + ' 字节');
add('参考 < 12,000', refs < 12000, refs + ' 字节');
add('单模板 < 10,000', maxTpl < 10000, maxTpl + ' 字节');
add('合计 < 27,000', skill + refs + maxTpl < 27000, (skill + refs + maxTpl) + ' 字节');

// 2. 测试
const tests = spawnSync(process.execPath, ['tests/runtime.test.mjs'], { cwd: rootPath, encoding: 'utf8' });
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

// 输出
let bad = 0;
for (const r of results) { if (!r.ok) bad++; console.log((r.ok ? '✓ ' : '✗ ') + r.name + (r.detail ? '  ' + r.detail : '')); }
console.log(bad ? '自检未通过：' + bad + ' 项' : '自检通过：' + results.length + ' 项');
process.exitCode = bad ? 1 : 0;
