import { normalizeAnimation } from './schema.mjs';
import { buildTimeline, firstFocusStep, pct } from './timeline.mjs';
import { layoutAnimation } from './layout.mjs';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const n = value => Number(value.toFixed(2)).toString();
const MOTION = {
  calm: { ease: 'cubic-bezier(.22,.61,.36,1)', edgeEase: 'cubic-bezier(.22,.61,.36,1)', nodeFrom: 'translateY(7px)' },
  precise: { ease: 'cubic-bezier(.16,1,.3,1)', edgeEase: 'cubic-bezier(.16,1,.3,1)', nodeFrom: 'scale(.965)' },
  lively: { ease: 'cubic-bezier(.34,1.56,.64,1)', edgeEase: 'cubic-bezier(.22,1,.36,1)', nodeFrom: 'scale(.82) translateY(5px)' }
};
const STYLE_MOTION = { 'style-a': 'calm', 'style-b': 'precise', 'style-c': 'lively' };

// 把布局生成的路径采样成 9 个点；流量点用 CSS translate 走折线，避开 offset-path 在 SVG 上的兼容差异。
function samplePath(path) {
  const v = (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const out = [];
  if (path.includes(' C ') && v.length >= 8) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = v;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, u = 1 - t;
      out.push([u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3, u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]);
    }
  } else if (v.length >= 4) {
    const [x0, y0, x1, y1] = v;
    for (let i = 0; i <= 8; i++) out.push([x0 + (x1 - x0) * i / 8, y0 + (y1 - y0) * i / 8]);
  }
  return out.length ? out : [[0, 0]];
}

function textNode(node) {
  const cx = node.x, cy = node.y;
  if (node.timeline) {
    return '<g class="anim-node tone-' + (node.tone ?? 'ink') + ' timeline" data-node="' + esc(node.id) + '">' +
      '<circle class="anim-milestone" cx="' + n(cx) + '" cy="' + n(cy) + '" r="9"/>' +
      '<text class="anim-label" x="' + n(cx) + '" y="' + n(cy - 20) + '" text-anchor="middle">' + esc(node.label) + '</text>' +
      (node.detail ? '<text class="anim-detail" x="' + n(cx) + '" y="' + n(cy + 28) + '" text-anchor="middle">' + esc(node.detail) + '</text>' : '') +
      '</g>';
  }
  const hasDetail = Boolean(node.detail);
  const labelY = hasDetail ? cy - 3 : cy + 5;
  return '<g class="anim-node tone-' + (node.tone ?? 'ink') + '" data-node="' + esc(node.id) + '">' +
    '<rect class="anim-box" x="' + n(cx - node.w / 2) + '" y="' + n(cy - node.h / 2) + '" width="' + n(node.w) + '" height="' + n(node.h) + '" rx="7"/>' +
    '<text class="anim-label" x="' + n(cx) + '" y="' + n(labelY) + '" text-anchor="middle">' + esc(node.label) + '</text>' +
    (hasDetail ? '<text class="anim-detail" x="' + n(cx) + '" y="' + n(cy + 15) + '" text-anchor="middle">' + esc(node.detail) + '</text>' : '') +
    '</g>';
}

function edgeNode(edge, markerId) {
  return '<g class="anim-edge tone-' + (edge.tone ?? 'muted') + (edge.dashed ? ' is-dashed' : '') + '" data-edge="' + esc(edge.id) + '">' +
    '<path class="anim-link" d="' + edge.path + '" pathLength="100" marker-end="url(#' + markerId + ')"/>' +
    '<circle class="anim-packet" r="3.4" cx="0" cy="0"/>' +
    (edge.label ? '<text class="anim-edge-label" x="' + n(edge.labelX) + '" y="' + n(edge.labelY) + '" text-anchor="middle">' + esc(edge.label) + '</text>' : '') +
    '</g>';
}

function focusNode(step, nodes, edges) {
  if (!step.focus?.length) return '';
  const byNode = new Map(nodes.map(node => [node.id, node]));
  const byEdge = new Map(edges.map(edge => [edge.id, edge]));
  let out = '<g class="anim-focus" data-step="' + esc(step.id) + '">';
  for (const id of step.focus) {
    const node = byNode.get(id);
    const edge = byEdge.get(id);
    if (node) {
      out += node.timeline
        ? '<circle class="anim-focus-node" cx="' + n(node.x) + '" cy="' + n(node.y) + '" r="16"/>'
        : '<rect class="anim-focus-node" x="' + n(node.x - node.w / 2 - 5) + '" y="' + n(node.y - node.h / 2 - 5) + '" width="' + n(node.w + 10) + '" height="' + n(node.h + 10) + '" rx="10"/>';
    } else if (edge) {
      out += '<path class="anim-focus-edge" d="' + edge.path + '" pathLength="100"/>';
    }
  }
  return out + '</g>';
}

function cssFor(anim, timeline, layout, motion) {
  const uid = 'anim-' + anim.id;
  const m = MOTION[motion];
  const total = n(timeline.total);
  const loop = anim.loop ? 'infinite' : '1';
  const lines = [];
  lines.push('.' + uid + '{margin:20px 0;border:1px solid var(--line,#C9D8E0);background:var(--paper,#fff);padding:14px 16px 10px;break-inside:avoid}');
  lines.push('.' + uid + ' .anim-head{display:flex;justify-content:space-between;gap:10px;align-items:baseline;margin:0 0 8px;font:600 13px/1.4 "Segoe UI","Microsoft YaHei",sans-serif;color:var(--ink,#12293d)}');
  lines.push('.' + uid + ' .anim-head small{font:10px/1.4 Consolas,monospace;color:var(--muted,#5b7283);white-space:nowrap}');
  lines.push('.' + uid + ' .anim-tools{display:flex;gap:10px;align-items:center;margin:0 0 6px;font:10px/1.4 Consolas,monospace;color:var(--muted,#5b7283)}');
  lines.push('.' + uid + ' .anim-pause{position:absolute;width:1px;height:1px;opacity:0}');
  lines.push('.' + uid + ' .anim-pause-label{cursor:pointer;border:1px solid var(--line,#C9D8E0);padding:2px 8px;border-radius:999px;background:var(--paper,#fff)}');
  lines.push('.' + uid + ' .anim-stage{position:relative;--anim-run:running}');
  lines.push('.' + uid + ' svg{display:block;width:100%;height:auto;overflow:visible}');
  lines.push('.' + uid + ' .anim-bg{fill:var(--paper,#fff)}');
  lines.push('.' + uid + ' .anim-axis{stroke:var(--line,#C9D8E0);stroke-width:1;stroke-dasharray:3 5}');
  lines.push('.' + uid + ' .anim-box{fill:var(--paper,#fff);stroke:var(--tone,var(--line,#C9D8E0));stroke-width:1.5}');
  lines.push('.' + uid + ' .anim-milestone{fill:var(--paper,#fff);stroke:var(--tone,var(--accent,#1A7F8E));stroke-width:2}');
  lines.push('.' + uid + ' .anim-label{fill:var(--ink,#12293d);font:600 14px "Segoe UI","Microsoft YaHei",sans-serif}');
  lines.push('.' + uid + ' .anim-detail{fill:var(--muted,#5b7283);font:10.5px Consolas,monospace}');
  lines.push('.' + uid + ' .anim-link{fill:none;stroke:var(--tone,var(--muted,#5b7283));stroke-width:2;stroke-dasharray:100;stroke-dashoffset:0}');
  lines.push('.' + uid + ' .is-dashed .anim-link{stroke-dasharray:3 5}');
  lines.push('.' + uid + ' .anim-edge-label{fill:var(--muted,#5b7283);font:10px Consolas,monospace}');
  lines.push('.' + uid + ' .anim-arrow{fill:var(--tone,var(--muted,#5b7283))}');
  lines.push('.' + uid + ' .anim-packet{opacity:0;fill:var(--accent,#1A7F8E);stroke:var(--paper,#fff);stroke-width:1.5;pointer-events:none}');
  lines.push('.' + uid + ' .anim-focus{opacity:0;pointer-events:none}');
  lines.push('.' + uid + ' .anim-focus-node{fill:none;stroke:var(--accent,#1A7F8E);stroke-width:2.5;stroke-dasharray:5 4}');
  lines.push('.' + uid + ' .anim-focus-edge{fill:none;stroke:var(--accent,#1A7F8E);stroke-width:4;stroke-dasharray:6 5;opacity:.9}');
  lines.push('.' + uid + ' .anim-caption{position:relative;height:48px;margin:4px 0 2px;font:12px/1.5 "Microsoft YaHei",sans-serif;color:var(--ink,#12293d)}');
  lines.push('.' + uid + ' .anim-cap{position:absolute;inset:0;opacity:0;display:flex;gap:8px;align-items:baseline}');
  lines.push('.' + uid + ' .anim-cap:first-child{opacity:1}');
  lines.push('.' + uid + ' .anim-cap-no{font:600 10px/1.5 Consolas,monospace;color:var(--accent,#1A7F8E)}');
  lines.push('.' + uid + ' .anim-cap strong{font-weight:600}.anim-cap span{color:var(--muted,#5b7283)}');
  lines.push('.' + uid + ' .anim-progress{height:2px;background:var(--line,#C9D8E0);margin:2px 0 0;overflow:hidden}');
  lines.push('.' + uid + ' .anim-progress i{display:block;height:100%;width:0;background:var(--accent,#1A7F8E)}');
  lines.push('.' + uid + ' .anim-steps{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:3px;font:11.5px/1.55 "Microsoft YaHei",sans-serif;color:var(--muted,#5b7283)}');
  lines.push('.' + uid + ' .anim-steps li{display:flex;gap:7px;align-items:baseline}');
  lines.push('.' + uid + ' .anim-steps b{font:600 10px/1.5 Consolas,monospace;color:var(--accent,#1A7F8E);min-width:18px}');
  lines.push('.' + uid + ' .tone-accent{--tone:var(--accent,#1A7F8E)}');
  lines.push('.' + uid + ' .tone-ink{--tone:var(--ink,#12293d)}');
  lines.push('.' + uid + ' .tone-muted{--tone:var(--muted,#5b7283)}');
  lines.push('.' + uid + ' .tone-warn{--tone:#b45309}');
  lines.push('.' + uid + ' .tone-ok{--tone:#0f766e}');
  lines.push('html:has(#night:checked) .' + uid + '{background:#0f1e2a;border-color:#24404f}');
  lines.push('html:has(#night:checked) .' + uid + ' .anim-box{fill:#122836;stroke:#3f5b6b}');
  lines.push('html:has(#night:checked) .' + uid + ' .anim-label{fill:#e6f2f8}');
  lines.push('html:has(#night:checked) .' + uid + ' .anim-detail,html:has(#night:checked) .' + uid + ' .anim-edge-label,html:has(#night:checked) .' + uid + ' .anim-steps{fill:#9fb6c4;color:#9fb6c4}');
  lines.push('html:has(#night:checked) .' + uid + ' .anim-link{stroke:#5f7d8c}');
  // 节点入场：首次成为 focus 时出现；默认静态最终可见。
  for (const node of layout.nodes) {
    const step = layout.timeline
      ? timeline.steps.find(candidate => candidate.id === node.id)
      : firstFocusStep(timeline.steps, node.id);
    if (!step) continue;
    const a = pct(step.startPct);
    lines.push('@keyframes ' + uid + '-node-' + node.id + '{0%,' + a + '%{opacity:0;transform:' + m.nodeFrom + '}' + pct(step.startPct + 4) + '%,100%{opacity:1;transform:none}}');
    lines.push('.' + uid + ' .anim-node[data-node="' + node.id + '"]{animation-name:' + uid + '-node-' + node.id + ';animation-duration:var(--anim-total);animation-timing-function:' + m.ease + ';animation-iteration-count:' + loop + ';animation-fill-mode:both;transform-box:fill-box;transform-origin:center}');
  }
  // 边：首次 focus 时画出；pathLength=100，dashoffset 100→0。
  for (const edge of layout.edges) {
    const step = firstFocusStep(timeline.steps, edge.id);
    if (!step) continue;
    const a = pct(step.startPct);
    const b = pct(Math.min(99, step.startPct + 10));
    lines.push('@keyframes ' + uid + '-edge-' + edge.id + '{0%,' + a + '%{opacity:0;stroke-dashoffset:100}' + pct(step.startPct + 1) + '%{opacity:1;stroke-dashoffset:100}' + b + '%,100%{opacity:1;stroke-dashoffset:0}}');
    lines.push('.' + uid + ' .anim-edge[data-edge="' + edge.id + '"]{animation-name:' + uid + '-edge-' + edge.id + ';animation-duration:var(--anim-total);animation-timing-function:' + m.edgeEase + ';animation-iteration-count:' + loop + ';animation-fill-mode:both}');
    lines.push('.' + uid + ' .anim-edge[data-edge="' + edge.id + '"] .anim-link{animation-name:' + uid + '-edge-' + edge.id + ';animation-duration:var(--anim-total);animation-timing-function:' + m.edgeEase + ';animation-iteration-count:' + loop + ';animation-fill-mode:both}');
  }
  // 流量点：沿边路径采样移动；暂停时由 animation-play-state 一起停住。
  for (const edge of layout.edges) {
    const step = firstFocusStep(timeline.steps, edge.id);
    if (!step) continue;
    const pts = samplePath(edge.path);
    const a = step.startPct;
    const b = Math.min(99, step.startPct + 7);
    const moves = pts.slice(1).map((pt, i) => {
      const p = a + (b - a) * (i + 1) / (pts.length - 1);
      return n(p) + '%{opacity:1;transform:translate(' + n(pt[0]) + 'px,' + n(pt[1]) + 'px)}';
    }).join('');
    lines.push('@keyframes ' + uid + '-packet-' + edge.id + '{0%,' + pct(a) + '%{opacity:0;transform:translate(' + n(pts[0][0]) + 'px,' + n(pts[0][1]) + 'px)}' + pct(step.startPct + .6) + '%{opacity:1;transform:translate(' + n(pts[0][0]) + 'px,' + n(pts[0][1]) + 'px)}' + moves + pct(Math.min(100, step.startPct + 8)) + '%,100%{opacity:0;transform:translate(' + n(pts.at(-1)[0]) + 'px,' + n(pts.at(-1)[1]) + 'px)}}');
    lines.push('.' + uid + ' .anim-edge[data-edge="' + edge.id + '"] .anim-packet{animation:' + uid + '-packet-' + edge.id + ' var(--anim-total) linear ' + loop + ' both}');
  }
  // 步骤高亮/字幕/进度：字幕轻微上浮，焦点环呼吸，时间轴仍是唯一时间源。
  lines.push('@keyframes ' + uid + '-pulse{0%,100%{stroke-opacity:.4}50%{stroke-opacity:1}}');
  lines.push('.' + uid + ' .anim-focus-node,.' + uid + ' .anim-focus-edge{animation:' + uid + '-pulse 1.25s ease-in-out infinite}');
  for (const step of timeline.steps) {
    const a = pct(step.startPct);
    const b = pct(step.endPct);
    const fade = step.endPct < 99.5 ? pct(Math.min(100, step.endPct + .4)) + '%,100%{opacity:0}' : '';
    const capFade = step.endPct < 99.5 ? pct(Math.min(100, step.endPct + .4)) + '%,100%{opacity:0;transform:translateY(4px)}' : '';
    lines.push('@keyframes ' + uid + '-step-' + step.id + '{0%,' + a + '%{opacity:0}' + pct(step.startPct + .4) + '%,' + b + '%{opacity:1}' + fade + '}');
    lines.push('@keyframes ' + uid + '-cap-' + step.id + '{0%,' + a + '%{opacity:0;transform:translateY(4px)}' + pct(step.startPct + 2) + '%,' + b + '%{opacity:1;transform:none}' + capFade + '}');
    lines.push('.' + uid + ' .anim-focus[data-step="' + step.id + '"]{animation-name:' + uid + '-step-' + step.id + ';animation-duration:var(--anim-total);animation-timing-function:' + m.ease + ';animation-iteration-count:' + loop + ';animation-fill-mode:both}');
    lines.push('.' + uid + ' .anim-cap[data-step="' + step.id + '"]{animation-name:' + uid + '-cap-' + step.id + ';animation-duration:var(--anim-total);animation-timing-function:' + m.ease + ';animation-iteration-count:' + loop + ';animation-fill-mode:both}');
  }
  lines.push('@keyframes ' + uid + '-progress{from{width:0}to{width:100%}}');
  lines.push('.' + uid + ' .anim-progress i{animation:' + uid + '-progress var(--anim-total) linear ' + loop + ' both}');
  lines.push('@keyframes ' + uid + '-playhead{from{transform:translateX(0)}to{transform:translateX(612px)}}');
  lines.push('.' + uid + ' .anim-playhead{stroke:var(--accent,#1A7F8E);stroke-width:2;animation:' + uid + '-playhead var(--anim-total) linear ' + loop + ' both}');
  lines.push('#' + uid + '-pause:checked ~ .anim-stage{--anim-run:paused}');
  lines.push('#animation-' + anim.id + ' .anim-stage,#animation-' + anim.id + ' .anim-stage *{animation-play-state:var(--anim-run,running)}');
  lines.push('@media (prefers-reduced-motion: reduce){.' + uid + ' .anim-node,.' + uid + ' .anim-link,.' + uid + ' .anim-focus,.' + uid + ' .anim-focus-node,.' + uid + ' .anim-focus-edge,.' + uid + ' .anim-packet,.' + uid + ' .anim-playhead,.' + uid + ' .anim-cap,.' + uid + ' .anim-progress i{animation:none!important}.' + uid + ' .anim-edge{animation:none!important;opacity:1!important}.' + uid + ' .anim-caption{display:none}.' + uid + ' .anim-node,.' + uid + ' .anim-link{opacity:1!important;stroke-dashoffset:0!important;transform:none!important}}');
  lines.push('@media print{.' + uid + ' .anim-tools,.' + uid + ' .anim-caption,.' + uid + ' .anim-progress,.' + uid + ' .anim-packet,.' + uid + ' .anim-playhead{display:none!important}.' + uid + ' .anim-edge{animation:none!important;opacity:1!important}.' + uid + ' .anim-node,.' + uid + ' .anim-link{animation:none!important;opacity:1!important;stroke-dashoffset:0!important;transform:none!important}.' + uid + ' .anim-focus{display:none!important}.' + uid + ' .anim-steps{margin-top:6px}}');
  return lines.join(String.fromCharCode(10));
}

export function renderAnimation(block, options = {}) {
  const anim = normalizeAnimation(block);
  const motion = anim.motion || STYLE_MOTION[options.style] || 'precise';
  const timeline = buildTimeline(anim);
  const layout = layoutAnimation(anim);
  const uid = 'anim-' + anim.id;
  const titleId = uid + '-title';
  const descId = uid + '-desc';
  const svgId = uid + '-arrow';
  const edges = layout.edges.map(edge => edgeNode(edge, svgId)).join(String.fromCharCode(10));
  const axis = layout.timeline
    ? '<line class="anim-axis" x1="54" y1="180" x2="666" y2="180"/><line class="anim-playhead" x1="54" y1="160" x2="54" y2="200"/>'
    : '';
  const nodes = layout.nodes.map(textNode).join(String.fromCharCode(10));
  const focuses = layout.timeline
    ? timeline.steps.map((step, i) => {
        const node = layout.nodes[i];
        return '<g class="anim-focus" data-step="' + esc(step.id) + '"><circle class="anim-focus-node" cx="' + n(node.x) + '" cy="' + n(node.y) + '" r="16"/></g>';
      }).join(String.fromCharCode(10))
    : timeline.steps.map(step => focusNode(step, layout.nodes, layout.edges)).join(String.fromCharCode(10));
  const captions = timeline.steps.map((step, i) =>
    '<p class="anim-cap" data-step="' + esc(step.id) + '"><span class="anim-cap-no">' + String(i + 1).padStart(2, '0') + '</span><strong>' + esc(step.label) + '</strong>' +
    (step.detail ? '<span>' + esc(step.detail) + '</span>' : '') + '</p>').join('');
  const steps = timeline.steps.map((step, i) =>
    '<li data-step="' + esc(step.id) + '"><b>' + String(i + 1).padStart(2, '0') + '</b><span><strong>' + esc(step.label) + '</strong>' +
    (step.detail ? ' · ' + esc(step.detail) : '') + '</span></li>').join('');
  const preset = { flow: '流程', state: '状态机', timeline: '时间线' }[anim.preset];
  const html = '<figure class="' + uid + ' anim-figure" id="animation-' + esc(anim.id) + '" aria-labelledby="' + titleId + '">' +
    '<input class="anim-pause" type="checkbox" id="' + uid + '-pause" aria-label="暂停或继续动画">' +
    '<figcaption class="anim-head"><span>' + esc(anim.title) + '</span><small>' + preset + ' · ' + n(timeline.total) + 's · ' + (anim.loop ? '循环' : '单次') + '</small></figcaption>' +
    '<div class="anim-tools"><label class="anim-pause-label" for="' + uid + '-pause">暂停 / 继续</label><span>按时间轴自动播放 · 可打印</span></div>' +
    '<div class="anim-stage" style="--anim-total:' + n(timeline.total) + 's">' +
    '<svg viewBox="0 0 720 360" role="img" aria-label="' + esc(anim.alt) + '">' +
    '<title id="' + titleId + '">' + esc(anim.title) + '</title><desc id="' + descId + '">' + esc(anim.alt) + '</desc>' +
    '<defs><marker id="' + svgId + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="anim-arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>' +
    '<rect class="anim-bg" x="0" y="0" width="720" height="360"/>' + axis +
    '<g class="anim-edges">' + edges + '</g><g class="anim-nodes">' + nodes + '</g>' +
    '<g class="anim-focuses">' + focuses + '</g></svg>' +
    '<div class="anim-caption" aria-hidden="true">' + captions + '</div>' +
    '<div class="anim-progress" aria-hidden="true"><i></i></div></div>' +
    '<ol class="anim-steps">' + steps + '</ol>' +
    (anim.caption ? '<p class="anim-note source">' + esc(anim.caption) + '</p>' : '') +
    '</figure>';
  return { html, css: cssFor(anim, timeline, layout, motion), motion };
}