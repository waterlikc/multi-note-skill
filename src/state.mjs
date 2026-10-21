import { validateNote, uniqueIds, requireValue, nonempty, canonical } from './contract.mjs';

export function validateState(state) {
  requireValue(state?.schemaVersion === 1, '不支持的状态 schemaVersion');
  validateNote(state.note);
  requireValue(state.graph && Array.isArray(state.graph.edges), '图谱结构缺失');
  const nodes = uniqueIds(state.graph.nodes, '知识节点');
  const sections = new Set(state.note.sections.map(s => s.id));
  for (const node of state.graph.nodes) {
    requireValue(nonempty(node.label), '知识节点缺少名称');
    requireValue(Array.isArray(node.sectionIds) && node.sectionIds.length > 0 && node.sectionIds.every(id => sections.has(id)), '知识节点引用了不存在的章节');
    requireValue(['unknown', 'learning', 'mastered', 'review'].includes(node.mastery), '掌握状态无效');
    requireValue(Array.isArray(node.evidence) && node.evidence.every(nonempty), '学习证据无效');
    requireValue(node.mastery === 'unknown' || node.evidence.length > 0, '不能无证据评估掌握情况');
  }
  // 模拟作答不算证据：只有模拟记录时，任何节点都不得给出掌握判断。
  const attempts = state.note.practice ?? [];
  if (attempts.length && !attempts.some(item => item.simulated === false)) {
    for (const node of state.graph.nodes) requireValue(node.mastery === 'unknown', '只有模拟作答时不能评估掌握状态');
  }
  const outgoing = new Map([...nodes].map(id => [id, []]));
  const incoming = new Map([...nodes].map(id => [id, 0]));
  const edgeKeys = new Set();
  for (const edge of state.graph.edges) {
    requireValue(nodes.has(edge.from) && nodes.has(edge.to) && edge.from !== edge.to, '关系包含悬空节点或自环');
    requireValue(['prerequisite', 'related', 'extends', 'contains'].includes(edge.type) && nonempty(edge.basis), '关系类型或依据缺失');
    const key = `${edge.from}/${edge.to}/${edge.type}`;
    requireValue(!edgeKeys.has(key), '重复关系'); edgeKeys.add(key);
    if (edge.type === 'prerequisite') {
      outgoing.get(edge.from).push(edge.to);
      incoming.set(edge.to, incoming.get(edge.to) + 1);
    }
  }
  const queue = [...incoming].filter(([, count]) => count === 0).map(([id]) => id);
  for (let cursor = 0; cursor < queue.length; cursor++) for (const id of outgoing.get(queue[cursor])) {
    incoming.set(id, incoming.get(id) - 1);
    if (incoming.get(id) === 0) queue.push(id);
  }
  requireValue(queue.length === nodes.size, '前置知识关系存在环');
  requireValue(Array.isArray(state.history) && state.history.length > 0, '缺少版本记录');
  let previous = 0;
  for (const item of state.history) {
    requireValue(Number.isSafeInteger(item.revision) && item.revision > previous && item.revision <= state.note.revision && nonempty(item.summary), '历史版本无效');
    previous = item.revision;
  }
  requireValue(previous === state.note.revision, '历史末版本与笔记不一致');
  return state;
}

export function createState(note, graph = { nodes: [], edges: [] }) {
  return validateState(structuredClone({ schemaVersion: 1, note, graph, history: [{ revision: note.revision, summary: '首次整理' }] }));
}

export function mergeState(state, patch) {
  validateState(state);
  requireValue(patch && patch.baseRevision === state.note.revision, '基础版本不一致，请先提供最新状态');
  requireValue(nonempty(patch.summary), '缺少更新摘要');
  const next = structuredClone(state);
  const conflicts = [];
  const changedIds = new Set();
  const sources = patch.sources ?? [];
  const sections = patch.sections ?? [];
  const objectives = patch.objectives ?? [];
  const practice = patch.practice ?? [];
  const replaceIds = patch.replaceIds ?? [];
  uniqueIds(sources, '补充来源'); uniqueIds(sections, '补充章节');
  uniqueIds(objectives, '补充目标'); uniqueIds(practice, '补充作答');
  requireValue(Array.isArray(replaceIds) && replaceIds.every(id => sections.some(s => s.id === id) && state.note.sections.some(s => s.id === id)), '替换 id 必须对应已有章节及新内容');
  let changed = false;
  for (const source of sources) {
    const old = next.note.sources.find(s => s.id === source.id);
    if (!old) { next.note.sources.push(structuredClone(source)); changed = true; }
    else if (canonical(old) !== canonical(source)) conflicts.push({ kind: 'source', id: source.id, before: old, after: source });
  }
  for (const objective of objectives) {
    const index = next.note.objectives ? next.note.objectives.findIndex(item => item.id === objective.id) : -1;
    if (index < 0) { (next.note.objectives ??= []).push(structuredClone(objective)); changed = true; }
    else if (canonical(next.note.objectives[index]) !== canonical(objective)) {
      conflicts.push({ kind: 'objective', id: objective.id, before: next.note.objectives[index], after: objective });
    }
  }
  for (const attempt of practice) {
    const index = next.note.practice ? next.note.practice.findIndex(item => item.id === attempt.id) : -1;
    if (index < 0) { (next.note.practice ??= []).push(structuredClone(attempt)); changed = true; }
    else if (canonical(next.note.practice[index]) !== canonical(attempt)) {
      conflicts.push({ kind: 'practice', id: attempt.id, before: next.note.practice[index], after: attempt });
    }
  }
  for (const section of sections) {
    const index = next.note.sections.findIndex(s => s.id === section.id);
    if (index < 0) { next.note.sections.push(structuredClone(section)); changed = true; }
    else if (canonical(next.note.sections[index]) !== canonical(section)) {
      if (!replaceIds.includes(section.id)) conflicts.push({ kind: 'section', id: section.id, before: next.note.sections[index], after: section });
      else { next.note.sections[index] = structuredClone(section); changedIds.add(section.id); changed = true; }
    }
  }
  if (conflicts.length) return { state: structuredClone(state), conflicts, changed: false };
  if (changed) {
    next.note.revision++;
    next.history.push({ revision: next.note.revision, summary: patch.summary });
    for (const node of next.graph.nodes) if (node.sectionIds.some(id => changedIds.has(id))) {
      node.mastery = 'unknown'; node.evidence = [];
    }
  }
  validateState(next);
  return { state: next, conflicts: [], changed };
}
