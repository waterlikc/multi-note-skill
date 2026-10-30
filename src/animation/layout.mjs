// 自动布局：不要求作者写坐标；flow/state 共用边路径，timeline 只排里程碑。
const W = 720, H = 360;
const boxW = 140, boxH = 62;

function flowPositions(nodes) {
  const n = nodes.length;
  let cols, rows, bw, gapX, startX, ys;
  if (n <= 3) {
    cols = n; rows = 1; bw = 150; gapX = 100;
    startX = (W - (cols * bw + (cols - 1) * gapX)) / 2;
    ys = [180];
  } else if (n === 4) {
    cols = 2; rows = 2; bw = 160; gapX = 96;
    startX = (W - (cols * bw + (cols - 1) * gapX)) / 2;
    ys = [112, 252];
  } else {
    cols = 3; rows = 2; bw = 130; gapX = 60;
    startX = (W - (cols * bw + (cols - 1) * gapX)) / 2;
    ys = [112, 252];
  }
  const bh = rows === 2 ? 56 : boxH;
  return nodes.map((node, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    return { ...node, x: startX + col * (bw + gapX) + bw / 2, y: ys[row], w: bw, h: bh };
  });
}

function statePositions(nodes) {
  const n = nodes.length;
  const cx = 360, cy = 180;
  if (n === 2) return [
    { ...nodes[0], x: 210, y: 180, w: 140, h: 58 },
    { ...nodes[1], x: 510, y: 180, w: 140, h: 58 }
  ];
  const radius = n <= 4 ? 132 : 138;
  const start = -Math.PI / 2;
  return nodes.map((node, i) => {
    const angle = start + (i * Math.PI * 2) / n;
    return { ...node, x: cx + Math.cos(angle) * radius * 1.45, y: cy + Math.sin(angle) * radius, w: 130, h: 56 };
  });
}

function edgeGeometry(from, to, bend = 0) {
  const f = from, t = to;
  if (f.id === t.id) {
    const x = f.x, y = f.y - f.h / 2;
    return {
      path: 'M ' + (x - 20) + ' ' + y + ' C ' + (x - 58) + ' ' + (y - 76) + ', ' + (x + 58) + ' ' + (y - 76) + ', ' + (x + 20) + ' ' + y,
      labelX: x, labelY: y - 62
    };
  }
  const sameRow = Math.abs(f.y - t.y) < 12;
  if (sameRow) {
    const right = f.x < t.x;
    const sx = f.x + (right ? f.w / 2 + 4 : -f.w / 2 - 4);
    const ex = t.x + (right ? -t.w / 2 - 4 : t.w / 2 + 4);
    if (Math.abs(bend) < 0.5) {
      return { path: 'M ' + sx + ' ' + f.y + ' L ' + ex + ' ' + t.y, labelX: (sx + ex) / 2, labelY: f.y - 12 };
    }
    const midY = f.y + bend;
    return {
      path: 'M ' + sx + ' ' + f.y + ' C ' + (sx + (ex - sx) * 0.28) + ' ' + midY + ', ' + (ex - (ex - sx) * 0.28) + ' ' + midY + ', ' + ex + ' ' + t.y,
      labelX: (sx + ex) / 2, labelY: midY - 10
    };
  }
  const down = f.y < t.y;
  const sx = f.x, sy = f.y + (down ? f.h / 2 + 3 : -f.h / 2 - 3);
  const ex = t.x, ey = t.y + (down ? -t.h / 2 - 3 : t.h / 2 + 3);
  const curve = Math.max(36, Math.abs(ex - sx) * 0.22);
  return {
    path: 'M ' + sx + ' ' + sy + ' C ' + sx + ' ' + (sy + (down ? curve : -curve)) + ', ' + ex + ' ' + (ey + (down ? -curve : curve)) + ', ' + ex + ' ' + ey,
    labelX: (sx + ex) / 2, labelY: (sy + ey) / 2 - 8
  };
}

export function layoutAnimation(anim) {
  if (anim.preset === 'timeline') {
    const n = anim.steps.length;
    const nodes = anim.steps.map((step, i) => ({
      ...step,
      x: n === 1 ? W / 2 : 84 + (i * (W - 168)) / (n - 1),
      y: 180, w: 26, h: 26, timeline: true
    }));
    return { width: W, height: H, nodes, edges: [], timeline: true };
  }
  const placed = anim.preset === 'state' ? statePositions(anim.nodes) : flowPositions(anim.nodes);
  const byId = new Map(placed.map(node => [node.id, node]));
  const pairIndex = new Map();
  const pairCount = new Map();
  for (const edge of anim.edges) {
    const key = [edge.from, edge.to].sort().join('|');
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }
  const edges = anim.edges.map(edge => {
    const key = [edge.from, edge.to].sort().join('|');
    const index = pairIndex.get(key) ?? 0;
    pairIndex.set(key, index + 1);
    const count = pairCount.get(key) ?? 1;
    const bend = count > 1 ? (index - (count - 1) / 2) * 42 : 0;
    const geom = edgeGeometry(byId.get(edge.from), byId.get(edge.to), bend);
    return { ...edge, ...geom };
  });
  return { width: W, height: H, nodes: placed, edges, timeline: false };
}