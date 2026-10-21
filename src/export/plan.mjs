import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateState, reviewSchedule, escapeHtml } from '../render/note.mjs';

const DAY = 86400000;
function parseStart(value) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('--start 必须是 YYYY-MM-DD');
  const time = Date.parse(value + 'T00:00:00Z');
  if (Number.isNaN(time)) throw new Error('--start 不是有效日期');
  return time;
}

// 把学习目标按天切分；没有目标时退化为按章节切分。
export function buildPlan(state, { days = 7, start = null } = {}) {
  validateState(state);
  const note = state.note;
  const labels = new Map();
  (note.objectives ?? []).forEach((objective, index) => labels.set(objective.id, '目标 ' + (index + 1)));
  const units = (note.objectives ?? []).map(objective => ({
    id: objective.id, label: labels.get(objective.id), text: objective.text,
    sections: objective.sectionIds.map(id => (note.sections.find(section => section.id === id) ?? {}).heading).filter(Boolean)
  }));
  if (!units.length) {
    for (const section of note.sections) units.push({ id: section.id, label: '章节', text: section.heading, sections: [section.heading] });
  }
  const total = Math.max(1, days);
  const buckets = Array.from({ length: total }, () => []);
  units.forEach((unit, index) => buckets[index % total].push(unit));

  // 复习只能排在这个目标被教过之后；没教过的目标不参与当天复习。
  const introDay = new Map();
  buckets.forEach((items, index) => items.forEach(item => introDay.set(item.id, index + 1)));
  const byDay = new Map();
  const overflow = [];
  for (const item of reviewSchedule(note)) {
    if (item.days === null) continue;
    const intro = introDay.get(item.id);
    if (!intro) continue;
    const due = intro + item.days;
    const label = labels.get(item.id) ?? item.id;
    if (due > total) { overflow.push({ ...item, label, overflow: true }); continue; }
    byDay.set(due, [...(byDay.get(due) ?? []), { ...item, label }]);
  }
  for (const item of overflow) {
    const intro = introDay.get(item.id);
    if (total <= intro) continue;                       // 计划只有一天，没有可顺延的复习日
    byDay.set(total, [...(byDay.get(total) ?? []), item]);
  }

  const startTime = start === null ? null : parseStart(start);
  return buckets.map((items, index) => ({
    day: index + 1,
    date: startTime === null ? null : new Date(startTime + index * DAY).toISOString().slice(0, 10),
    items,
    reviews: byDay.get(index + 1) ?? []
  }));
}

export function renderPlanHtml(state, plan, days) {
  const e = escapeHtml;
  const rows = plan.map(day => {
    const label = day.date ? '第 ' + day.day + ' 天 · ' + day.date : '第 ' + day.day + ' 天';
    const items = day.items.length
      ? day.items.map(item => '<li title="' + e(item.id) + '"><strong>' + e(item.label) + '</strong> ' + e(item.text) + '</li>').join('')
      : '<li class="empty">当天不安排新目标，用于补习与复盘</li>';
    const reviews = day.reviews.length
      ? day.reviews.map(item => '<strong title="' + e(item.id) + '">' + e(item.label) + '</strong> ' + e(item.text) + '（间隔 ' + item.days + ' 天' + (item.overflow ? '，计划期外顺延' : '') + '）').join('；')
      : '—';
    return '<tr><td>' + label + '</td><td><ul>' + items + '</ul></td><td>' + reviews + '</td></tr>';
  }).join('');
  const labels = new Map();
  (state.note.objectives ?? []).forEach((objective, index) => labels.set(objective.id, '目标 ' + (index + 1)));
  const objectives = (state.note.objectives ?? []).length
    ? '<ul>' + state.note.objectives.map(objective =>
      '<li title="' + e(objective.id) + '"><strong>' + labels.get(objective.id) + '</strong> ' + e(objective.text) + '<ul>' +
      objective.criteria.map(item => '<li>' + e(item) + '</li>').join('') + '</ul></li>').join('') + '</ul>'
    : '<p class="source">本笔记未提供学习目标，按章节排期。</p>';
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    e(state.note.title) + ' · ' + days + ' 天学习计划</title><style>' +
    'body{margin:0;background:#edf1f4;color:#202c36;font:16px/1.75 "Microsoft YaHei",sans-serif}' +
    'main{max-width:920px;margin:40px auto;padding:40px 48px;background:#fff}' +
    'h1{font-size:28px;margin:0 0 8px}h2{font-size:21px;color:#214c79;margin:28px 0 12px}' +
    'table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5dc;padding:10px;vertical-align:top;text-align:left}' +
    'th{background:#eaf2fa}ul{margin:0;padding-left:20px}.empty{color:#52616b}' +
    '.source{color:#52616b;font-size:14px}@media print{@page{size:A4;margin:15mm}body{background:#fff}main{margin:0;padding:0}}' +
    '</style></head><body><main><h1>' + e(state.note.title) + ' · ' + days + ' 天学习计划</h1>' +
    '<p class="source">计划只排顺序，不承诺进度；没完成的顺延到次日，不自动判定掌握；复习只排在学习之后。</p>' +
    '<h2>学习目标与验收标准</h2>' + objectives +
    '<h2>每日安排</h2><table><thead><tr><th>日期</th><th>新目标</th><th>当天复习</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<p class="source">复习节奏依据真实作答次数推算；演示作答不计入。</p></main></body></html>';
}
