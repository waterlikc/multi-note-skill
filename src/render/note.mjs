import { readFile } from 'node:fs/promises';
import { validateNote, scenes, canonical } from '../contract.mjs';
import { validateState } from '../state.mjs';
export { createState, mergeState, validateState } from '../state.mjs';
export { resolveInput } from '../input.mjs';
export { validateNote } from '../contract.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const origins = { source:'来源材料', supplement:'补充解释', uncertain:'需确认' };
const verdicts = { right:'答对', wrong:'答错', skip:'未作答' };

// 真实作答才计入掌握；模拟作答单独统计，只用于演示。
export function summarisePractice(note) {
  const list = note.practice ?? [];
  const real = list.filter(item => item.simulated === false);
  const simulated = list.filter(item => item.simulated === true);
  return {
    total: list.length, real: real.length, simulated: simulated.length,
    right: real.filter(item => item.verdict === 'right').length,
    wrong: real.filter(item => item.verdict === 'wrong').length
  };
}

// 间隔复习（SM-2 简化版）：答错回到 1 天，连续答对按 3 → 7 → 16 天推进。
export function reviewSchedule(note) {
  const attempts = (note.practice ?? []).filter(item => item.simulated === false && item.objectiveId);
  const stats = new Map();
  for (const item of attempts) {
    const current = stats.get(item.objectiveId) ?? { right: 0, wrong: 0 };
    if (item.verdict === 'right') current.right++;
    else if (item.verdict === 'wrong') current.wrong++;
    stats.set(item.objectiveId, current);
  }
  return (note.objectives ?? []).map(objective => {
    const stat = stats.get(objective.id);
    if (!stat) return { id: objective.id, text: objective.text, days: null, label: '尚未练习', real: 0 };
    const real = stat.right + stat.wrong;
    if (stat.wrong > 0) return { id: objective.id, text: objective.text, days: 1, label: '有答错，1 天后重做', real };
    if (stat.right >= 3) return { id: objective.id, text: objective.text, days: 16, label: '连续答对，16 天后复习', real };
    if (stat.right === 2) return { id: objective.id, text: objective.text, days: 7, label: '答对两次，7 天后复习', real };
    return { id: objective.id, text: objective.text, days: 3, label: '答对一次，3 天后复习', real };
  });
}

// id 是引用键，不面向读者；展示统一用「目标 N」，id 放到小字与 title 里。
export function objectiveLabels(note) {
  const labels = new Map();
  (note.objectives ?? []).forEach((objective, index) => labels.set(objective.id, '目标 ' + (index + 1)));
  return labels;
}

function renderObjectives(note) {
  if (!note.objectives?.length) return '';
  const e = escapeHtml;
  const headings = new Map(note.sections.map(section => [section.id, section.heading]));
  const labels = objectiveLabels(note);
  const items = note.objectives.map(objective => {
    const criteria = objective.criteria.map(item => '<li>' + e(item) + '</li>').join('');
    const links = objective.sectionIds.map(id => '<a href="#section-' + id + '">' + e(headings.get(id) || id) + '</a>').join('、');
    return '<li id="objective-' + objective.id + '"><strong>' + labels.get(objective.id) + '</strong> ' + e(objective.text) +
      '<ul class="criteria">' + criteria + '</ul>' +
      '<p class="source">对应章节：' + links + '</p></li>';
  }).join('');
  return '<section class="objectives" id="objectives"><h2>学习目标与验收标准</h2><ul>' + items +
    '</ul><p class="source">验收标准用于自测：每条都能做到，才算完成这个目标。</p></section>';
}

function renderPractice(note) {
  if (!note.practice?.length) return '';
  const e = escapeHtml;
  const summary = summarisePractice(note);
  const realText = summary.real ? '真实作答 ' + summary.real + ' 题（答对 ' + summary.right + ' / 答错 ' + summary.wrong + '）' : '还没有真实作答';
  const simText = summary.simulated ? '；演示作答 ' + summary.simulated + ' 题，不计入掌握' : '';
  const hasObjectives = (note.objectives ?? []).length > 0;
  const labels = objectiveLabels(note);
  const rows = note.practice.map(item =>
    '<tr class="' + (item.simulated ? 'simulated' : item.verdict) + '">' +
    '<td>' + item.id + '</td><td>' + e(item.question) + '</td><td>' + e(item.answer) + '</td>' +
    '<td>' + verdicts[item.verdict] + '</td>' +
    (hasObjectives ? '<td' + (item.objectiveId ? ' title="' + e(item.objectiveId) + '"' : '') + '>' +
      (item.objectiveId ? (labels.get(item.objectiveId) ?? '—') : '—') + '</td>' : '') +
    '<td>' + (item.simulated ? '演示，不计入' : '真实作答') + '</td></tr>').join('');
  return '<section class="practice" id="practice"><h2>自测与错题</h2>' +
    '<p class="source">' + realText + simText + '。</p>' +
    '<table><thead><tr><th scope="col">题号</th><th scope="col">题目</th><th scope="col">我的作答</th><th scope="col">判定</th>' +
    (hasObjectives ? '<th scope="col">目标</th>' : '') + '<th scope="col">来源</th></tr></thead><tbody>' +
    rows + '</tbody></table></section>';
}

// 知识结构图：分层卡片 + 折线箭头 + 图例；纯内联 SVG，无脚本、无外链。
function renderMindmap(state) {
  const nodes = state.graph.nodes;
  if (nodes.length < 2) return '';
  const e = escapeHtml;
  const depth = new Map(nodes.map(node => [node.id, 0]));
  // 相关边也参与分层：让“相关”节点落在来源右侧，而不是被当成起点。
  const prereq = state.graph.edges.filter(edge => edge.from !== edge.to);
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const edge of prereq) {
      const next = Math.min(depth.get(edge.from) + 1, nodes.length - 1);
      if (next > depth.get(edge.to)) { depth.set(edge.to, next); changed = true; }
    }
    if (!changed) break;
  }
  const cols = Math.max(0, ...depth.values()) + 1;
  const groups = Array.from({ length: cols }, () => []);
  for (const node of nodes) groups[depth.get(node.id)].push(node);
  const compact = nodes.length > 12;
  const cardW = 172, cardH = compact ? 52 : 60, gapX = 58, gapY = compact ? 18 : 26;
  const padX = 16, padTop = 34, padBottom = 26;
  const rows = Math.max(...groups.map(group => group.length));
  const width = padX * 2 + cols * cardW + (cols - 1) * gapX;
  const height = padTop + rows * cardH + (rows - 1) * gapY + padBottom;
  const pos = new Map();
  groups.forEach((group, ci) => group.forEach((node, ri) => {
    pos.set(node.id, { x: padX + ci * (cardW + gapX), y: padTop + ri * (cardH + gapY) });
  }));
  const colors = { unknown: '#52616b', learning: '#214c79', mastered: '#175c58', review: '#65442e' };
  const mastery = { unknown: '尚未评估', learning: '正在学习', mastered: '已掌握', review: '建议复习' };
  const shorten = (value, n) => (value.length > n ? value.slice(0, n) + '…' : value);
  const arrow = (x, y) => '<polygon points="' + x + ',' + y + ' ' + (x - 9) + ',' + (y - 4) + ' ' + (x - 9) + ',' + (y + 4) + '" fill="#52616b"/>';

  const edgeShapes = [];
  for (const edge of state.graph.edges) {
    const from = pos.get(edge.from), to = pos.get(edge.to);
    if (!from || !to) continue;
    const dashed = edge.type !== 'prerequisite';
    const stroke = dashed ? '#8a99a6' : '#52616b';
    const x1 = from.x + cardW, y1 = from.y + cardH / 2;
    const x2 = to.x, y2 = to.y + cardH / 2;
    if (x2 > x1) {
      const midX = Math.round((x1 + x2) / 2);
      edgeShapes.push('<path d="M' + x1 + ' ' + y1 + ' H' + midX + ' V' + y2 + ' H' + (x2 - 10) + '" fill="none" stroke="' + stroke + '" stroke-width="1.4"' +
        (dashed ? ' stroke-dasharray="5 4"' : '') + '><title>' + e(edge.from + ' → ' + edge.to + (edge.basis ? '：' + edge.basis : '')) + '</title></path>' + arrow(x2, y2));
    } else {
      // 同列或回指：走底部走廊，避免横穿卡片。
      const sx = from.x + cardW / 2, sy2 = from.y + cardH;
      const tx = to.x + cardW / 2, ty2 = to.y + cardH;
      const baseY = height - 12;
      edgeShapes.push('<path d="M' + sx + ' ' + sy2 + ' V' + (baseY - 4) + ' H' + tx + ' V' + (ty2 + 9) + '" fill="none" stroke="#8a99a6" stroke-width="1.1" stroke-dasharray="4 4"><title>' + e(edge.from + ' → ' + edge.to) + '</title></path>' +
        '<polygon points="' + tx + ',' + (ty2 - 1) + ' ' + (tx - 5) + ',' + (ty2 + 9) + ' ' + (tx + 5) + ',' + (ty2 + 9) + '" fill="#8a99a6"/>');
    }
  }

  const cards = groups.map((group, ci) => {
    const header = '<text x="' + (padX + ci * (cardW + gapX)) + '" y="20" font-size="10" letter-spacing="2" fill="#7a8895">第 ' + (ci + 1) + ' 层' + (ci === 0 ? ' · 起点' : ' · 递进') + '</text>';
    return header + group.map(node => {
      const point = pos.get(node.id);
      const color = colors[node.mastery] || colors.unknown;
      return '<g><rect x="' + point.x + '" y="' + point.y + '" width="' + cardW + '" height="' + cardH + '" rx="6" fill="#fff" stroke="#d5dee6" stroke-width="1.2"/>' +
        '<rect x="' + point.x + '" y="' + point.y + '" width="4" height="' + cardH + '" rx="2" fill="' + color + '"/>' +
        '<text x="' + (point.x + 14) + '" y="' + (point.y + 24) + '" font-size="14" font-weight="600" fill="#202c36">' + e(shorten(node.label, 9)) + '</text>' +
        '<text x="' + (point.x + 14) + '" y="' + (point.y + 43) + '" font-size="10.5" fill="' + color + '">' + mastery[node.mastery] + '</text>' +
        '<title>' + e(node.label) + ' · ' + mastery[node.mastery] + '</title></g>';
    }).join('');
  }).join('');

  return '<section class="mindmap" id="mindmap"><h2>知识结构</h2><figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height +
    '" width="' + width + '" height="' + height + '" role="img" aria-label="知识结构图：' + nodes.length + ' 个节点，分 ' + cols + ' 层" style="max-width:100%;height:auto">' +
    edgeShapes.join('') + cards +
    '</svg><figcaption>按前置关系分层：左边先学，右边后学；实线是前置，虚线是相关；颜色表示掌握状态。</figcaption></figure></section>';
}

// 无状态时的结构图：章节卡片按行排列，保证不缩放、字号可读。
function renderOutlineMap(note) {
  const sections = note.sections;
  if (sections.length < 3) return '';
  const e = escapeHtml;
  const perRow = 4, cardW = 168, cardH = 62, gapX = 26, gapY = 26, padX = 12, padY = 14;
  const rows = Math.ceil(sections.length / perRow);
  const width = padX * 2 + perRow * cardW + (perRow - 1) * gapX;
  const height = padY * 2 + rows * cardH + (rows - 1) * gapY;
  const arrow = (x, y) => '<polygon points="' + x + ',' + y + ' ' + (x - 8) + ',' + (y - 4) + ' ' + (x - 8) + ',' + (y + 4) + '" fill="#9db0c0"/>';
  const cards = sections.map((section, index) => {
    const row = Math.floor(index / perRow), col = index % perRow;
    const x = padX + col * (cardW + gapX);
    const y = padY + row * (cardH + gapY);
    const short = section.heading.length > 11 ? section.heading.slice(0, 11) + '…' : section.heading;
    return '<g><a href="#section-' + section.id + '"><rect x="' + x + '" y="' + y + '" width="' + cardW + '" height="' + cardH + '" rx="6" fill="#fff" stroke="#d5dee6"/>' +
      '<text x="' + (x + 12) + '" y="' + (y + 21) + '" font-size="11" fill="#7a8895">' + String(index + 1).padStart(2, '0') + '</text>' +
      '<text x="' + (x + 12) + '" y="' + (y + 44) + '" font-size="14" font-weight="600" fill="#202c36">' + e(short) + '</text></a>' +
      '<title>' + e(section.heading) + '</title></g>' +
      (col < perRow - 1 && index < sections.length - 1 ? arrow(x + cardW + gapX - 9, y + cardH / 2) : '');
  }).join('');
  return '<section class="mindmap" id="outline"><h2>结构一览</h2><figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height +
    '" width="' + width + '" height="' + height + '" role="img" aria-label="章节结构图：' + sections.length + ' 节" style="max-width:100%;height:auto">' +
    cards + '</svg><figcaption>按章节顺序从左到右、从上到下阅读；点击卡片跳到对应章节。</figcaption></figure></section>';
}

function renderReviewPlan(state) {
  const plan = reviewSchedule(state.note);
  if (!plan.length) return '';
  const e = escapeHtml;
  const labels = objectiveLabels(state.note);
  const rows = plan.map(item => '<tr><td title="' + e(item.id) + '">' + (labels.get(item.id) ?? item.id) + '</td><td>' + e(item.text) + '</td><td>' +
    (item.real ? item.real + ' 次真实作答' : '—') + '</td><td>' + e(item.label) + '</td></tr>').join('');
  return '<section class="review" id="review"><h2>复习节奏</h2><table><thead><tr><th scope="col">目标</th><th scope="col">内容</th><th scope="col">依据</th><th scope="col">下次复习</th></tr></thead><tbody>' +
    rows + '</tbody></table><p class="source">间隔只依据真实作答次数推算，不预测学习效果。</p></section>';
}

function renderGraph(state) {
  if (!state.graph.nodes.length) return '';
  const e = escapeHtml;
  const mastery = { unknown:'尚未评估', learning:'正在学习', mastered:'已掌握（有记录）', review:'建议复习（有记录）' };
  const relations = { prerequisite:'是以下知识的前置', related:'相关', extends:'扩展到', contains:'包含' };
  const labels = new Map(state.graph.nodes.map(node => [node.id, node.label]));
  const list = state.graph.nodes.map(node => '<li><strong>' + e(node.label) + '</strong> · ' + mastery[node.mastery] +
    (node.evidence.length ? '<p>' + node.evidence.map(e).join('；') + '</p>' : '') + '</li>').join('');
  const table = state.graph.edges.length
    ? '<table><thead><tr><th scope="col">关联</th><th scope="col">依据</th></tr></thead><tbody>' +
      state.graph.edges.map(edge => '<tr><td>' + e(labels.get(edge.from)) + ' → ' + relations[edge.type] + ' → ' +
        e(labels.get(edge.to)) + '</td><td>' + e(edge.basis) + '</td></tr>').join('') + '</tbody></table>'
    : '<p>目前没有足够依据建立知识关系。</p>';
  return '<section><h2>知识关联与复习记录</h2><ul>' + list + '</ul>' + table +
    '<p class="source">关系可辅助安排复习，不能代替实际答题评估。</p></section>';
}

function renderBlock(block) {
  const e = escapeHtml;
  switch (block.type) {
    case 'paragraph': return '<p>' + e(block.text) + '</p>';
    case 'callout': return '<aside class="callout"><strong>提示</strong><p>' + e(block.text) + '</p></aside>';
    case 'code': return '<figure class="code"><figcaption>' + e(block.language || '代码') + '</figcaption><pre><code>' + e(block.text) + '</code></pre></figure>';
    case 'list': return '<ul>' + block.items.map(item => '<li>' + e(item) + '</li>').join('') + '</ul>';
    case 'table': return '<table><thead><tr>' + block.headers.map(h => '<th scope="col">' + e(h) + '</th>').join('') + '</tr></thead><tbody>' +
      block.rows.map(row => '<tr>' + row.map(cell => '<td>' + e(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  }
}

export async function generateNote(note, state) {
  validateNote(note);
  if (state) {
    validateState(state);
    if (canonical(state.note) !== canonical(note)) throw new Error('状态和渲染的笔记不一致');
  }
  const template = await readFile(new URL('../../assets/template-' + note.style.at(-1) + '.html', import.meta.url), 'utf8');
  const e = escapeHtml;
  // 长笔记的导航收成编号块，避免十几条标题挤成三行。
  const nav = (note.sections.length >= 8
    ? note.sections.map((s, i) => '<a class="num" href="#section-' + s.id + '" title="' + e(s.heading) + '">' + (i + 1) + '</a>').join('')
    : note.sections.map(s => '<a href="#section-' + s.id + '">' + e(s.heading) + '</a>').join('')) +
    (note.objectives?.length ? '<a href="#objectives">学习目标</a>' : '') +
    (note.practice?.length ? '<a href="#practice">自测与错题</a>' : '');
  const sections = note.sections.map((s, index) =>
    '<section id="section-' + s.id + '" data-no="' + String(index + 1).padStart(2, '0') + '"><p class="eyebrow">' + origins[s.origin] + '</p>' +
    '<h2><span class="sec-no">' + String(index + 1).padStart(2, '0') + '</span>' + e(s.heading) + '</h2>' +
    s.blocks.map(renderBlock).join('\n') + '<p class="source">' +
    (s.sourceIds.length ? '依据：' + s.sourceIds.map(id => '<a href="#source-' + id + '">[' + id + ']</a>').join(' ') : '补充解释，不是原文摘录') +
    '</p>' + (note.sections[index + 1] ? '<p class="next-link"><a href="#section-' + note.sections[index + 1].id + '">下一节：' +
      e(note.sections[index + 1].heading) + ' →</a></p>' : '') + '</section>').join('\n');
  // 长笔记才显示右下角章节翻页；短笔记保持干净。
  const pager = note.sections.length >= 5
    ? '<nav class="pager" aria-label="章节翻页">' + note.sections.map((s, i) =>
        '<a href="#section-' + s.id + '" title="' + e(s.heading) + '">' + (i + 1) + '</a>').join('') +
      '<a class="pager-top" href="#top" aria-label="回到顶部">↑</a></nav>'
    : '';
  const slots = {
    TITLE: e(note.title), SCENE: e(scenes[note.scene]), REVISION: String(note.revision), SUMMARY: e(note.summary),
    NAV: nav,
    PAGER: pager,
    CONTENT: renderObjectives(note) + sections + renderPractice(note),
    SOURCES: note.sources.map(s => '<li id="source-' + s.id + '"><strong>[' + s.id + '] ' + e(s.label) + '</strong>' +
      (s.url ? ' <a class="src-link" href="' + e(s.url) + '" rel="noopener">原文</a>' : '') +
      '<blockquote>' + e(s.text) + '</blockquote></li>').join('\n'),
    STATE: state ? (renderMindmap(state) || renderOutlineMap(note)) + renderReviewPlan(state) + renderGraph(state) +
      '<section class="portable-state"><h2>继续学习</h2><p>保存本文件，或复制以下 JSON。下次对话提供旧文件或 JSON 后，可继续更新；此处没有云端存储。</p><p>版本 ' +
      note.revision + ' · ' + e(state.history.at(-1).summary) + '</p><pre id="note-state">' + e(JSON.stringify(state, null, 2)) + '</pre></section>' : renderOutlineMap(note)
  };
  // 只在原始模板上替换一次，避免用户文字中的占位符被二次解释。
  const html = template.replace(/\{\{([A-Z]+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(slots, key)) throw new Error('未知模板字段 ' + key);
    return slots[key];
  });
  return { html, metadata: { mode: 'programmatic', schemaVersion: 1, revision: note.revision, style: note.style } };
}

// 交互版：把三套主题的 CSS 内联进来，用按钮切换；默认导出仍是单主题无脚本版本。
export async function generateInteractive(note, state) {
  const styles = ['style-a', 'style-b', 'style-c'];
  const docs = {};
  for (const style of styles) {
    const variant = { ...note, style };
    const st = state ? structuredClone(state) : undefined;
    if (st) st.note = variant;
    docs[style.at(-1)] = (await generateNote(variant, st)).html;
  }
  const cssOf = id => {
    const match = docs[id].match(/<style>([\s\S]*?)<\/style>/);
    return match ? match[1] : '';
  };
  const css = { a: cssOf('a'), b: cssOf('b'), c: cssOf('c') };
  const current = note.style.at(-1);
  let html = docs[current].replace('<style>', '<style id="theme-css">');
  html = html.replace(
    '<span class="tb-meta">v' + note.revision + '</span>',
    '<span class="tb-meta">v' + note.revision + '</span>' +
    '<span class="style-switch" role="group" aria-label="切换排版">' +
    '<button data-style="a">杂志</button><button data-style="b">蓝图</button><button data-style="c">手账</button></span>'
  );
  const extraCss = '<style>.topbar .tb-meta{margin-right:auto}.style-switch{display:flex;gap:4px}' +
    '.style-switch button{appearance:none;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;' +
    'border-radius:999px;padding:5px 10px;font:600 11.5px/1 "Segoe UI","Microsoft YaHei",sans-serif;cursor:pointer}' +
    '.style-switch button[aria-pressed="true"]{background:#4fb3c0;border-color:#4fb3c0;color:#06222a}' +
    '.topbar .night-toggle-label{margin-left:8px}' +
    '@media print{.style-switch{display:none}}</style>';
  html = html.replace('</head>', extraCss + '</head>');
  const payload = JSON.stringify(css).split('</').join('<\\/');
  const script = '<script>(function(){var CSS=' + payload + ';var current="' + current + '";' +
    'var el=document.getElementById("theme-css");var btns=[].slice.call(document.querySelectorAll(".style-switch button"));' +
    'function apply(id){if(!CSS[id])return;current=id;el.textContent=CSS[id];btns.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.style===id));});}' +
    'btns.forEach(function(b){b.addEventListener("click",function(){apply(b.dataset.style);});});' +
    'apply(current);})();</script>';
  html = html.replace('</body>', script + '</body>');
  return { html, metadata: { mode: 'interactive', schemaVersion: 1, revision: note.revision, style: note.style } };
}
