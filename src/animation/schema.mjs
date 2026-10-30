// 概念动画：严格、可审计的声明式规格；不接受 raw SVG/HTML，也不跑任意 JS。
export const PRESETS = {
  flow: '流程',
  state: '状态机',
  timeline: '时间线'
};
export const TONES = new Set(['accent', 'ink', 'muted', 'warn', 'ok']);
export const MOTIONS = new Set(['calm', 'precise', 'lively']);

const idOk = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const len = (value, min, max) => typeof value === 'string' && value.length >= min && value.length <= max;
const fail = message => { throw new Error('动画块：' + message); };

export function validateAnimation(block) {
  if (!block || block.type !== 'animation') fail('type 必须是 animation');
  if (!idOk(block.id)) fail('id 无效');
  if (!Object.hasOwn(PRESETS, block.preset)) fail('preset 只能是 flow/state/timeline');
  if (!len(block.title, 2, 40)) fail('title 需为 2–40 字');
  if (!len(block.alt, 8, 160)) fail('alt 需为 8–160 字，供读屏使用');
  if (block.caption !== undefined && !len(block.caption, 0, 120)) fail('caption 不能超过 120 字');
  if (block.loop !== undefined && typeof block.loop !== 'boolean') fail('loop 必须是布尔值');
  if (block.motion !== undefined && !MOTIONS.has(block.motion)) fail('motion 只能是 calm/precise/lively');

  const nodes = block.nodes ?? [];
  const edges = block.edges ?? [];
  if (!Array.isArray(nodes) || !Array.isArray(edges)) fail('nodes/edges 必须是数组');
  if (block.preset === 'timeline') {
    if (nodes.length || edges.length) fail('timeline 不需要 nodes/edges');
  } else {
    if (nodes.length < 2 || nodes.length > 6) fail('nodes 需为 2–6 个');
    if (edges.length < 1 || edges.length > 8) fail('edges 需为 1–8 条');
  }
  const nodeIds = new Set();
  for (const node of nodes) {
    if (!node || !idOk(node.id) || nodeIds.has(node.id)) fail('节点 id 无效或重复');
    nodeIds.add(node.id);
    if (!len(node.label, 1, 24)) fail('节点 label 需为 1–24 字：' + node.id);
    if (node.detail !== undefined && !len(node.detail, 0, 48)) fail('节点 detail 不能超过 48 字：' + node.id);
    if (node.tone !== undefined && !TONES.has(node.tone)) fail('节点 tone 不支持：' + node.tone);
  }
  const edgeIds = new Set();
  if (block.preset !== 'timeline') {
    for (const edge of edges) {
      if (!edge || !idOk(edge.id) || edgeIds.has(edge.id)) fail('边 id 无效或重复');
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) fail('边引用了不存在的节点：' + edge.id);
      if (edge.label !== undefined && !len(edge.label, 0, 24)) fail('边 label 不能超过 24 字：' + edge.id);
      if (edge.tone !== undefined && !TONES.has(edge.tone)) fail('边 tone 不支持：' + edge.tone);
      if (edge.dashed !== undefined && typeof edge.dashed !== 'boolean') fail('dashed 必须是布尔值');
    }
  }

  if (!Array.isArray(block.steps) || block.steps.length < 2 || block.steps.length > 8) fail('steps 需为 2–8 步');
  const stepIds = new Set();
  let total = 0;
  for (const step of block.steps) {
    if (!step || !idOk(step.id) || stepIds.has(step.id)) fail('步骤 id 无效或重复');
    stepIds.add(step.id);
    if (!len(step.label, 1, 24)) fail('步骤 label 需为 1–24 字：' + step.id);
    if (step.detail !== undefined && !len(step.detail, 0, 48)) fail('步骤 detail 不能超过 48 字：' + step.id);
    const hold = step.hold ?? 1.4;
    if (typeof hold !== 'number' || !Number.isFinite(hold) || hold < 0.8 || hold > 4) fail('hold 需为 0.8–4 秒：' + step.id);
    total += hold;
    if (step.focus !== undefined && (!Array.isArray(step.focus) || step.focus.length > 4)) fail('focus 最多 4 个：' + step.id);
    for (const focus of step.focus ?? []) {
      if (!nodeIds.has(focus) && !edgeIds.has(focus)) fail('focus 引用了不存在的节点/边：' + focus);
    }
  }
  if (total < 4 || total > 20) fail('总时长需为 4–20 秒，当前 ' + total.toFixed(1) + ' 秒');
}

export function normalizeAnimation(block) {
  validateAnimation(block);
  return {
    ...block,
    loop: block.loop !== false,
    motion: block.motion,
    nodes: block.nodes ?? [],
    edges: block.edges ?? [],
    steps: block.steps.map(step => ({ ...step, hold: step.hold ?? 1.4, focus: step.focus ?? [] }))
  };
}
