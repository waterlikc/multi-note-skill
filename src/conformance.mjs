import { auditHtml } from './audit.mjs';

// 笔记规范基线：契约之外的结构要求，保证不同模型产出的笔记长得像同一套东西。
export const RULES = {
  sections: [8, 16],
  objectives: [3, 6],
  practice: [3, 6],
  blocksPerSection: [1, 8],
  title: [6, 48],
  summaryMin: 20,
};

export function checkNote(note) {
  const issues = [];
  const compact = note?.compact === true;
  const limits = compact
    ? { ...RULES, sections: [4, 8], objectives: [2, 4], practice: [2, 4] }
    : RULES;
  const add = msg => issues.push(msg);
  if (!note || typeof note !== 'object') return ['笔记不是对象'];
  if (!note.title || note.title.length < RULES.title[0] || note.title.length > RULES.title[1]) add('标题长度应在 6–48 字');
  if (!note.summary || note.summary.length < RULES.summaryMin) add('摘要少于 20 字');
  if (!Array.isArray(note.sources) || note.sources.length < 1) add('至少需要一个来源');
  for (const s of note.sources ?? []) {
    if (!s.label || !s.text) add('来源必须有说明和原文：' + (s.id ?? '?'));
    if (s.url && !/^https:\/\//.test(s.url)) add('来源链接必须是 https：' + s.id);
  }

  const sections = note.sections ?? [];
  if (sections.length < limits.sections[0] || sections.length > limits.sections[1]) add(`章节数 ${sections.length}，规范为 ${limits.sections[0]}–${limits.sections[1]}${compact ? '（compact）' : ''}`);
  const headings = new Set();
  for (const s of sections) {
    if (headings.has(s.heading)) add('章节标题重复：' + s.heading);
    headings.add(s.heading);
    const blocks = s.blocks ?? [];
    if (blocks.length < RULES.blocksPerSection[0]) add('章节没有内容块：' + s.id);
    if (blocks.length > RULES.blocksPerSection[1]) add('章节内容块过多（>8）：' + s.id);
    for (const b of blocks) {
      if (b.type === 'table') {
        const width = (b.headers ?? []).length;
        if (!width) add('表格缺表头：' + s.id);
        for (const row of b.rows ?? []) if (row.length !== width) add('表格列数不一致：' + s.id);
      }
      if (b.type === 'list' && (!b.items || !b.items.length)) add('列表为空：' + s.id);
      if ((b.type === 'paragraph' || b.type === 'callout' || b.type === 'code') && !b.text) add('内容块为空：' + s.id);
    }
  }

  const scene = note.scene;
  const objectives = note.objectives ?? [];
  if (scene !== 'meeting' && (objectives.length < limits.objectives[0] || objectives.length > limits.objectives[1])) add(`学习目标数 ${objectives.length}，规范为 ${limits.objectives[0]}–${limits.objectives[1]}${compact ? '（compact）' : ''}`);
  for (const o of objectives) {
    if (!Array.isArray(o.criteria) || o.criteria.length < 2) add('目标验收标准少于 2 条：' + o.id);
    for (const id of o.sectionIds ?? []) if (!sections.some(s => s.id === id)) add('目标引用了不存在的章节：' + o.id);
  }

  const practice = note.practice ?? [];
  if (scene !== 'meeting' && (practice.length < limits.practice[0] || practice.length > limits.practice[1])) add(`自测题数 ${practice.length}，规范为 ${limits.practice[0]}–${limits.practice[1]}${compact ? '（compact）' : ''}`);
  for (const p of practice) {
    if (!p.question || !p.answer) add('自测题缺题干或答案：' + p.id);
    if (typeof p.simulated !== 'boolean') add('自测题必须标明真实/演示：' + p.id);
  }

  if (scene === 'meeting') {
    const decision = sections.flatMap(s => s.blocks ?? []).some(b => b.type === 'table' &&
      (b.headers ?? []).some(h => /决策|行动|决定|负责人|截止/.test(h)));
    if (!decision) add('会议笔记需要决策/行动表（表头含决策、行动、负责人、截止）');
  }
  if (scene === 'reading') {
    const quote = sections.some(s => s.origin === 'source' && (s.sourceIds ?? []).length);
    const reflection = sections.some(s => s.origin === 'supplement');
    if (!quote) add('读书笔记至少需要一节原文引用（origin=source）');
    if (!reflection) add('读书笔记至少需要一节自己的解释（origin=supplement）');
  }

  const hasTransfer = sections.some(s => /迁移|举一反三|transfer/i.test(s.heading + ' ' + s.id));
  if (scene !== 'meeting' && !hasTransfer) add('缺少迁移任务小节（标题含“迁移/举一反三”或 id=transfer）');
  const tables = sections.flatMap(s => s.blocks ?? []).filter(b => b.type === 'table').length;
  const callouts = sections.flatMap(s => s.blocks ?? []).filter(b => b.type === 'callout').length;
  if (!tables) add('至少需要一个表格');
  if (!callouts && scene !== 'meeting') add('至少需要一个提示块');
  return issues;
}

export function checkHtml(html, note) {
  const issues = [];
  if (/<script\b/i.test(html)) issues.push('默认产物不应包含脚本');
  if (/<link\b/i.test(html)) issues.push('默认产物不应包含 link');
  if (!/<main\b/.test(html)) issues.push('缺少 main 容器');
  const sectionCount = (html.match(/<section\b/g) ?? []).length;
  const expected = (note.sections ?? []).length;
  if (expected && sectionCount < expected) issues.push(`产物章节数 ${sectionCount} 少于源数据 ${expected}`);
  issues.push(...auditHtml(html));
  return issues;
}