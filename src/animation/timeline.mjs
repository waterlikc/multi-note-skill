// 时间轴是唯一真相：节点/边/字幕/进度都从这里的百分比派生。
export function buildTimeline(anim) {
  let cursor = 0;
  const steps = anim.steps.map((step, index) => {
    const start = cursor;
    cursor += step.hold;
    return { ...step, index, start, end: cursor, startPct: (start / cursor) * 100, endPct: (cursor / cursor) * 100 };
  });
  const total = cursor;
  return {
    total,
    loop: anim.loop,
    steps: steps.map(step => ({
      ...step,
      startPct: (step.start / total) * 100,
      endPct: (step.end / total) * 100
    }))
  };
}

export function firstFocusStep(steps, id) {
  return steps.find(step => (step.focus ?? []).includes(id)) ?? null;
}

export function clampPct(value) {
  return Math.max(0, Math.min(100, value));
}

export function pct(value) {
  return clampPct(value).toFixed(2).replace(/\.?0+$/, '');
}
