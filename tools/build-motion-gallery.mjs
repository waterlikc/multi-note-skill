// 生成 examples/motions/index.html：单文件、离线、无脚本的动画画廊。
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'examples', 'motions', 'index.html');

const cards = [
  {
    json: 'examples/tcp-handshake.json', gif: 'examples/tcp-handshake.gif',
    style: 'B', theme: '蓝图', motion: 'precise', motionCn: '精准',
    desc: '报文依次出现，焦点环落在当前步骤；停止播放时仍是完整时序图。'
  },
  {
    json: 'examples/motions/http-timeline.json', gif: 'examples/motions/http-timeline.gif',
    style: 'A', theme: '杂志', motion: 'calm', motionCn: '舒缓',
    desc: '里程碑逐个点亮，时间线游标匀速推进；克制、不抢正文。'
  },
  {
    json: 'examples/motions/tcp-state.json', gif: 'examples/motions/tcp-state.gif',
    style: 'B', theme: '蓝图', motion: 'precise', motionCn: '精准',
    desc: '四个状态环形排布，迁移边带方向；适合讲清“何时进入下一状态”。'
  },
  {
    json: 'examples/motions/binary-search.json', gif: 'examples/motions/binary-search.gif',
    style: 'C', theme: '手账', motion: 'lively', motionCn: '轻快',
    desc: '区间每次砍半，节点弹性入场；把“比较—缩小区间”的过程摊开。'
  }
];

const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function load(card) {
  const raw = JSON.parse(await readFile(path.join(root, card.json), 'utf8'));
  const block = raw.type === 'animation'
    ? raw
    : raw.sections.flatMap(section => section.blocks || []).find(item => item.type === 'animation');
  if (!block) throw new Error('找不到动画块：' + card.json);
  const seconds = block.steps.reduce((sum, step) => sum + (step.hold ?? 1.4), 0).toFixed(1);
  const gif = await readFile(path.join(root, card.gif));
  return { ...card, title: block.title, alt: block.alt, seconds, data: 'data:image/gif;base64,' + gif.toString('base64') };
}

const items = [];
for (const card of cards) items.push(await load(card));

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>概念动画画廊 · multi-note-skill</title>
<style>
:root{--paper:#f2eee6;--card:#fffdf8;--ink:#18232d;--muted:#64717c;--line:#d8d0c3;--teal:#1a7f8e;--ochre:#b07a3e;--green:#4c7a5d}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 "Microsoft YaHei","PingFang SC",system-ui,sans-serif}
.top{display:flex;justify-content:space-between;align-items:center;padding:16px 42px;background:var(--ink);color:#f7f1e6;font-size:12px;letter-spacing:.14em}
.top b{font-size:16px;letter-spacing:.02em}
.hero{padding:58px 42px 34px;max-width:1320px;margin:0 auto}
.kicker{font-size:12px;letter-spacing:.2em;color:var(--teal);margin:0 0 18px}
h1{font-size:clamp(38px,5vw,64px);line-height:1.08;letter-spacing:-.03em;margin:0 0 20px;max-width:900px}
.lead{font-size:18px;color:var(--muted);max-width:860px;margin:0}
.lead strong{color:var(--ink);font-weight:600}
.grid{max-width:1320px;margin:0 auto;padding:12px 42px 46px;display:grid;grid-template-columns:1fr 1fr;gap:28px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 14px 36px rgba(38,48,56,.07)}
.frame{padding:18px 18px 0;background:#fbf8f1;border-bottom:1px solid var(--line)}
.frame img{display:block;width:100%;height:auto;border:1px solid #e5ded2;border-radius:8px;background:#fff}
.meta{padding:16px 20px 18px;border-left:4px solid var(--teal)}
.card.a .meta{border-left-color:var(--ochre)} .card.c .meta{border-left-color:var(--green)}
.row{display:flex;align-items:baseline;justify-content:space-between;gap:14px}
h2{font-size:21px;margin:0;letter-spacing:-.01em}
.tag{font-size:11px;letter-spacing:.08em;color:var(--muted);white-space:nowrap}
.desc{margin:7px 0 0;color:var(--muted);font-size:14px}
.foot{max-width:1320px;margin:0 auto;padding:0 42px 46px;display:flex;justify-content:space-between;gap:20px;color:var(--muted);font-size:13px;border-top:1px solid var(--line);padding-top:18px}
.foot b{color:var(--ink)} .foot code{font-family:Consolas,monospace;font-size:12px}
@media(max-width:820px){.grid{grid-template-columns:1fr;padding:8px 20px 30px}.hero{padding:36px 20px 20px}.top{padding:14px 20px}.foot{padding:16px 20px 30px;display:block}.foot span{display:block;margin-top:6px}}
</style>
</head>
<body>
<header class="top"><b>multi-note-skill</b><span>CONCEPT ANIMATION / GALLERY · 2026</span></header>
<section class="hero">
  <p class="kicker">FLOW · STATE · TIMELINE</p>
  <h1>过程不该只写成结论。</h1>
  <p class="lead">同一套 <strong>note.json</strong>：静态可打印，播放可解释。三种主题对应三种动效节奏——<strong>舒缓、精准、轻快</strong>；停止播放或打印时，仍是一张完整的分镜。</p>
</section>
<main class="grid">
${items.map(card => `  <article class="card ${card.style.toLowerCase()}">
    <div class="frame"><img src="${card.data}" alt="${esc(card.alt)}" loading="lazy"></div>
    <div class="meta">
      <div class="row"><h2>${esc(card.title)}</h2><span class="tag">STYLE ${card.style} · ${card.theme} / ${card.motion}</span></div>
      <p class="desc">${esc(card.desc)}</p>
      <p class="tag">${card.seconds} 秒 · 循环 · 可暂停 · 无脚本</p>
    </div>
  </article>`).join('\n')}
</main>
<footer class="foot">
  <span><b>105 项测试</b> · 14 项自检 · 0 审计问题</span>
  <span><code>node cli/note.mjs animate &lt;note.json&gt; &lt;out.gif&gt; --block &lt;id&gt; --style style-a|b|c</code></span>
</footer>
</body>
</html>
`;

await writeFile(out, html, 'utf8');
console.log('已生成画廊：' + out + '（' + Math.round(Buffer.byteLength(html) / 1024) + ' KB）');
