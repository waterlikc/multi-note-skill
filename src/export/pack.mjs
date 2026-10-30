import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { generateNote, escapeHtml } from '../render/note.mjs';
import { auditHtml } from '../audit.mjs';
import { scenes } from '../contract.mjs';

const e = escapeHtml;

async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path, out);
    else if (entry.name.endsWith('.json')) out.push(path);
  }
  return out;
}

function stateForNote(note) {
  const nodes = note.sections.map((section, index) => ({
    id: 'n' + (index + 1), label: section.heading, sectionIds: [section.id], mastery: 'unknown', evidence: []
  }));
  const edges = nodes.slice(0, -1).map((node, index) => ({
    from: node.id, to: nodes[index + 1].id, type: 'prerequisite', basis: '按笔记顺序阅读'
  }));
  return { schemaVersion: 1, note, graph: { nodes, edges }, history: [{ revision: note.revision, summary: '课程包生成' }] };
}

function blockText(block) {
  if (block.type === 'paragraph' || block.type === 'callout' || block.type === 'code') return block.text;
  if (block.type === 'list') return block.items.join(' ');
  if (block.type === 'table') return [block.headers.join(' '), ...block.rows.map(row => row.join(' '))].join(' ');
  if (block.type === 'image') return [block.alt, block.caption || ''].join(' ');
  return '';
}

function sectionText(section) {
  return [section.heading, ...section.blocks.map(blockText)].join(' ');
}

function keywordName(term) {
  return 'keyword-' + createHash('sha1').update(term).digest('hex').slice(0, 8) + '.html';
}

function keywordPage(term, hits, back) {
  const items = hits.map(hit => '<li><a href="' + e(hit.file) + '#' + e(hit.sectionId) + '">' +
    e(hit.title) + ' · ' + e(hit.heading) + '</a><p>' + e(hit.snippet) + '</p></li>').join('');
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>关键词 · ' + e(term) + '</title><style>body{margin:0;background:#eef3f6;color:#12293d;font:16px/1.8 "Microsoft YaHei",sans-serif}' +
    '.wrap{max-width:820px;margin:0 auto;padding:48px 32px}h1{font-size:2rem;margin:0 0 6px}.lead{color:#5b7283;margin:0 0 24px}' +
    'ul{list-style:none;padding:0}li{background:#fff;border-left:4px solid #1a7f8e;padding:16px 20px;margin:12px 0}' +
    'a{color:#12293d;text-decoration:none;font-weight:700}li p{margin:6px 0 0;font-size:13px;color:#5b7283}' +
    '.back{font:12px/1.8 Consolas,monospace;color:#5b7283;text-decoration:none}</style></head><body><div class="wrap">' +
    '<p class="lead">关键词索引 · ' + hits.length + ' 处</p><h1>' + e(term) + '</h1><ul>' + items + '</ul>' +
    '<a class="back" href="' + e(back) + '">← 返回课程包</a></div></body></html>';
}

export async function buildPack(inputDir, outHtml) {
  const outPath = resolve(outHtml);
  const outDir = dirname(outPath);
  const files = await collect(resolve(inputDir));
  const items = [];
  for (const file of files) {
    let note;
    try { note = JSON.parse(await readFile(file, 'utf8')); } catch { continue; }
    if (!note || note.schemaVersion !== 1 || !note.id || !Array.isArray(note.sections)) continue;
    let html;
    try { html = (await generateNote(note, stateForNote(note))).html; } catch { continue; }
    const issues = auditHtml(html);
    const name = note.id.replace(/[^a-zA-Z0-9_-]/g, '-') + '.html';
    await writeFile(join(outDir, name), html, 'utf8');
    items.push({ note, name, issues });
  }
  const totalSections = items.reduce((n, x) => n + x.note.sections.length, 0);
  const totalObjectives = items.reduce((n, x) => n + (x.note.objectives?.length ?? 0), 0);
  const totalIssues = items.reduce((n, x) => n + x.issues.length, 0);

  const keywords = new Map();
  for (const { note } of items) for (const term of note.keywords ?? []) keywords.set(term, (keywords.get(term) ?? 0) + 1);
  const keywordList = [...keywords.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const hitsByTerm = new Map(keywordList.map(([term]) => [term, []]));
  for (const { note, name } of items) {
    for (const term of note.keywords ?? []) {
      for (const section of note.sections) {
        const text = sectionText(section);
        if (!text.includes(term)) continue;
        const at = text.indexOf(term);
        const snippet = text.slice(Math.max(0, at - 28), Math.min(text.length, at + term.length + 42)).replace(/\s+/g, ' ');
        hitsByTerm.get(term)?.push({ file: name, title: note.title, sectionId: section.id, heading: section.heading, snippet });
      }
    }
  }
  for (const [term, hits] of hitsByTerm) {
    if (!hits.length) continue;
    await writeFile(join(outDir, keywordName(term)), keywordPage(term, hits, 'index.html'), 'utf8');
  }
  const active = keywordList.filter(([term]) => hitsByTerm.get(term)?.length);
  const chips = active.map(([term, count]) => '<a class="kw" href="' + keywordName(term) + '">' + e(term) + '<span>' + count + '</span></a>').join('');

  const cards = items.map(({ note, name, issues }) => {
    const badge = issues.length ? issues.length + ' 个审计问题' : '审计通过';
    const color = issues.length ? '#B5503A' : '#1A7F8E';
    return '<a class="card" href="' + e(name) + '"><div class="card-top"><span class="tag">' + e(scenes[note.scene] ?? note.scene) + '</span>' +
      '<span class="badge" style="color:' + color + '">' + badge + '</span></div>' +
      '<h2>' + e(note.title) + '</h2><p>' + e(note.summary) + '</p>' +
      '<div class="meta">' + note.sections.length + ' 节 · ' + (note.objectives?.length ?? 0) + ' 个目标 · ' +
      (note.practice?.length ?? 0) + ' 道自测</div></a>';
  }).join('');

  const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>课程包 · multi-note-skill</title><style>' +
    ':root{--ink:#12293d;--accent:#1a7f8e;--line:#c9d8e0;--muted:#5b7283}' +
    '*{box-sizing:border-box}body{margin:0;background:#eef3f6;color:var(--ink);font:16px/1.7 "Microsoft YaHei",system-ui,sans-serif}' +
    '.wrap{max-width:1000px;margin:0 auto;padding:48px 32px}' +
    'header{border-left:6px solid var(--ink);padding:8px 0 8px 20px;margin-bottom:28px}' +
    'h1{font-size:2rem;margin:0 0 6px}.lead{color:var(--muted)}' +
    '.stats{display:flex;flex-wrap:wrap;gap:20px;margin:22px 0 18px;font:600 12px/1 Consolas,monospace;color:var(--accent)}' +
    '.kws{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 28px;padding:16px 0;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line)}' +
    '.kw{display:inline-flex;gap:6px;align-items:center;font:12px/1 Consolas,monospace;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:6px 10px;text-decoration:none}' +
    '.kw span{color:var(--accent)}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}' +
    '.card{display:block;background:#fff;border:1px solid var(--line);border-left:4px solid var(--accent);padding:20px;text-decoration:none;color:inherit}' +
    '.card:hover{border-color:var(--accent)}.card-top{display:flex;justify-content:space-between;font:11px/1 Consolas,monospace}' +
    '.tag{color:var(--muted)}.badge{font-weight:700}' +
    '.card h2{font-size:1.15rem;margin:12px 0 8px}.card p{font-size:13px;color:var(--muted);margin:0 0 12px}' +
    '.meta{font:11px/1 Consolas,monospace;color:var(--muted)}' +
    'footer{margin-top:34px;border-top:1px dashed var(--line);padding-top:14px;font:11px/1.7 Consolas,monospace;color:var(--muted)}' +
    '@media(max-width:700px){.grid{grid-template-columns:1fr}}@media print{body{background:#fff}.card{break-inside:avoid}}' +
    '</style></head><body><div class="wrap"><header><h1>课程包</h1><p class="lead">' +
    items.length + ' 份笔记，全部离线可读、可打印；点关键词找章节，点卡片进入单份笔记。</p></header>' +
    '<div class="stats"><span>' + items.length + ' 份笔记</span><span>' + totalSections + ' 节</span><span>' +
    totalObjectives + ' 个目标</span><span>' + totalIssues + ' 个审计问题</span></div>' +
    (chips ? '<div class="kws">' + chips + '</div>' : '') +
    '<div class="grid">' + cards + '</div>' +
    '<footer>由 multi-note-skill 生成 · 离线可读 · 每份笔记都带来源与自测</footer></div></body></html>';
  await writeFile(outPath, html, 'utf8');
  return { notes: items.length, sections: totalSections, issues: totalIssues, keywords: active.length };
}
