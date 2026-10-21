import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { buildPlan } from './export/plan.mjs';

// 产物审计：只做静态检查，不启动浏览器、不依赖网络。
export function auditHtml(html) {
  const issues = [];
  // 来源区允许 https 原文链接，其余区域仍然禁止外链。
  const sourceBlock = (html.match(/<ol class="sources">[\s\S]*?<\/ol>/) || [''])[0];
  const body = sourceBlock ? html.split(sourceBlock).join('') : html;
  for (const link of sourceBlock.matchAll(/href="([^"]+)"/g)) {
    if (!/^https:\/\//.test(link[1])) issues.push('来源链接必须使用 https');
  }
  const bad = [
    [/<script\b/i, '包含 script'],
    [/<iframe\b/i, '包含 iframe'],
    [/<link\b/i, '包含 link'],
    [/<img\b/i, '包含 img'],
    [/@import/i, '包含 @import'],
    [/url\(/i, '包含 url()'],
    [/src="https?:/i, '外链 src'],
    [/href="https?:/i, '外链 href'],
    [/\bundefined\b/, '出现 undefined'],
    [/\bNaN\b/, '出现 NaN'],
    [/\[object Object\]/, '出现 [object Object]']
  ];
  for (const [pattern, message] of bad) if (pattern.test(body)) issues.push(message);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) issues.push('重复 id：' + duplicates.join('、'));
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  const broken = [...new Set(anchors.filter(anchor => !ids.includes(anchor)))];
  if (broken.length) issues.push('失效锚点：' + broken.join('、'));
  for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const th = (row[1].match(/<th\b/g) || []).length;
    const td = (row[1].match(/<td\b/g) || []).length;
    if (th && td && th !== td) { issues.push('表格列数不一致'); break; }
  }
  for (const svg of html.matchAll(/<svg\b[^>]*>/g)) {
    if (!/aria-label="[^"]+"/.test(svg[0])) issues.push('SVG 缺少 aria-label');
  }
  if (/<ul[^>]*>\s*<\/ul>/.test(html)) issues.push('存在空列表');
  return issues;
}

// CSV 审计：逐行解析，检查列数与表头。
export function auditCsv(text) {
  const issues = [];
  const source = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return ['CSV 为空'];
  const width = rows[0].length;
  rows.forEach((item, index) => { if (item.length !== width) issues.push('第 ' + (index + 1) + ' 行列数为 ' + item.length + '，表头为 ' + width); });
  if (rows[0][0] !== 'front' || rows[0][1] !== 'back') issues.push('表头不是 front,back,…');
  return issues;
}

// 计划审计：复习不得早于目标被学过。
export function auditPlan(state, days) {
  const issues = [];
  const plan = buildPlan(state, { days });
  const intro = new Map();
  plan.forEach(day => day.items.forEach(item => intro.set(item.id, day.day)));
  plan.forEach(day => day.reviews.forEach(item => {
    const start = intro.get(item.id);
    if (start === undefined) return;
    if (day.day <= start) issues.push(item.id + ' 在学之前就被安排复习（第 ' + day.day + ' 天）');
  }));
  return issues;
}

async function collect(dir, suffix, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path, suffix, out);
    else if (entry.name.endsWith(suffix)) out.push(path);
  }
  return out;
}
