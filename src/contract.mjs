export const scenes = { tech:'技术学习', course:'课堂学习', science:'科普知识', reading:'读书笔记', meeting:'会议纪要', research:'调研分析', project:'项目报告' };
export const styles = ['style-a', 'style-b', 'style-c'];
export function requireValue(condition, message) { if (!condition) throw new Error(message); }
export function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
export function checkId(value) { return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value); }
export function uniqueIds(items, label) {
  requireValue(Array.isArray(items), `${label} 必须为数组`);
  const seen = new Set();
  for (const item of items) {
    requireValue(item && checkId(item.id) && !seen.has(item.id), `${label} id 无效或重复`);
    seen.add(item.id);
  }
  return seen;
}
export function validateNote(note) {
  requireValue(note && note.schemaVersion === 1, '不支持的笔记 schemaVersion');
  requireValue(checkId(note.id), '笔记 id 无效');
  requireValue(Number.isSafeInteger(note.revision) && note.revision > 0, 'revision 必须为正整数');
  requireValue(nonempty(note.title) && typeof note.summary === 'string', '缺少标题或摘要');
  requireValue(Object.hasOwn(scenes, note.scene) && styles.includes(note.style), '未知场景或主题');
  const sourceIds = uniqueIds(note.sources, '来源');
  requireValue(note.sources.length > 0, '至少需要一个真实来源');
  for (const source of note.sources) requireValue(nonempty(source.label) && nonempty(source.text), '来源必须有说明和原文');
  const sectionIds = uniqueIds(note.sections, '章节');
  requireValue(note.sections.length > 0, '至少需要一个章节');
  for (const section of note.sections) {
    requireValue(nonempty(section.heading), '章节缺少标题');
    requireValue(['source', 'supplement', 'uncertain'].includes(section.origin), '章节需标明内容性质');
    requireValue(Array.isArray(section.sourceIds) && section.sourceIds.every(id => sourceIds.has(id)), '章节引用了不存在的来源');
    requireValue(section.origin === 'supplement' || section.sourceIds.length > 0, '来源章节需有引用');
    requireValue(Array.isArray(section.blocks) && section.blocks.length > 0, '章节缺少内容块');
    for (const block of section.blocks) {
      requireValue(block && typeof block === 'object', '内容块无效');
      if (['paragraph', 'callout', 'code'].includes(block.type)) {
        requireValue(nonempty(block.text), '内容块文本为空');
        if (block.language !== undefined) requireValue(typeof block.language === 'string', '代码语言必须为文字');
      } else if (block.type === 'list') {
        requireValue(Array.isArray(block.items) && block.items.length > 0 && block.items.every(nonempty), '列表为空或包含非文本');
      } else if (block.type === 'table') {
        requireValue(Array.isArray(block.headers) && block.headers.length > 0 && block.headers.every(nonempty), '表头无效');
        requireValue(Array.isArray(block.rows) && block.rows.every(row => Array.isArray(row) && row.length === block.headers.length && row.every(v => typeof v === 'string')), '表格行列数不一致');
      } else throw new Error(`不支持的内容块：${block.type}`);
    }
  }
  validateObjectives(note, sectionIds);
  validatePractice(note);
  return note;
}

// 学习目标：编号 + 验收标准 + 对应章节；用于「知识清单」与学习计划。
function validateObjectives(note, sectionIds) {
  if (note.objectives === undefined) return;
  requireValue(Array.isArray(note.objectives), '学习目标必须为数组');
  uniqueIds(note.objectives, '学习目标');
  for (const objective of note.objectives) {
    requireValue(nonempty(objective.text), '学习目标缺少描述');
    requireValue(Array.isArray(objective.criteria) && objective.criteria.length > 0 && objective.criteria.every(nonempty), '学习目标必须有验收标准');
    requireValue(Array.isArray(objective.sectionIds) && objective.sectionIds.length > 0 && objective.sectionIds.every(id => sectionIds.has(id)), '学习目标引用了不存在的章节');
  }
}

// 作答记录：真实作答才计入掌握；模拟作答允许存在，但不得当作证据。
function validatePractice(note) {
  if (note.practice === undefined) return;
  requireValue(Array.isArray(note.practice), '作答记录必须为数组');
  uniqueIds(note.practice, '作答记录');
  const objectiveIds = new Set((note.objectives ?? []).map(item => item.id));
  for (const attempt of note.practice) {
    requireValue(nonempty(attempt.question) && nonempty(attempt.answer), '作答记录缺少题目或作答');
    requireValue(['right', 'wrong', 'skip'].includes(attempt.verdict), '作答判定只能是 right / wrong / skip');
    requireValue(typeof attempt.simulated === 'boolean', '作答记录必须标明是否为模拟');
    if (attempt.objectiveId !== undefined) requireValue(objectiveIds.has(attempt.objectiveId), '作答记录引用了不存在的学习目标');
    if (attempt.note !== undefined) requireValue(typeof attempt.note === 'string', '作答备注必须为文字');
  }
}

// 对象键排序后比较；章节和列表的顺序仍有语义，不排序数组。
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
