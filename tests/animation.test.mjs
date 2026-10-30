import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateNote, validateNote, renderAnimation, validateAnimation, normalizeAnimation } from '../index.mjs';
import { auditHtml } from '../scripts/audit.mjs';
import { checkNote } from '../src/conformance.mjs';

const root = new URL('../', import.meta.url);
const note = JSON.parse(await readFile(new URL('examples/tcp-handshake.json', root), 'utf8'));
const clone = value => structuredClone(value);
const block = () => clone(note.sections[1].blocks[0]);

test('动画：TCP 示例通过契约和 lint', () => {
  assert.doesNotThrow(() => validateNote(note));
  assert.deepEqual(checkNote(note), []);
});

test('动画：渲染为内联 SVG + CSS，无脚本/外链', async () => {
  const { html } = await generateNote(note);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-label="/);
  assert.match(html, /@keyframes anim-tcp-three-way-step-s1/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /#anim-tcp-three-way-pause:checked ~ \.anim-stage\{--anim-run:paused\}/);
  assert.match(html, /#animation-tcp-three-way \.anim-stage \*\{animation-play-state:var\(--anim-run,running\)\}/);
  assert.match(html, /\.anim-edge\[data-edge="[^"]+"\]\{animation-name:anim-tcp-three-way-edge-/);
  assert.match(html, /@media print/);
  assert.doesNotMatch(html, /<script\b|<link\b|(?:src|href)="https?:\/\//i);
  assert.match(html, /url\(#anim-tcp-three-way-arrow\)/);
});

test('动画：审计通过，内部 marker url 不误报，外链 url 仍被拦', async () => {
  const { html } = await generateNote(note);
  assert.deepEqual(auditHtml(html), []);
  assert.ok(auditHtml('<style>.x{background:url(https://x/y.png)}</style>').includes('包含 url()'));
});

test('动画：三种主题都能渲染并保留动画', async () => {
  const easings = {
    'style-a': /cubic-bezier\(\.22,\.61,\.36,1\)/,
    'style-b': /cubic-bezier\(\.16,1,\.3,1\)/,
    'style-c': /cubic-bezier\(\.34,1\.56,\.64,1\)/
  };
  for (const style of ['style-a', 'style-b', 'style-c']) {
    const { html } = await generateNote({ ...note, style });
    assert.match(html, /anim-tcp-three-way/);
    assert.match(html, /<svg[^>]+aria-label=/);
    assert.match(html, /class="anim-packet"/);
    assert.match(html, easings[style]);
    assert.doesNotMatch(html, /<script\b|<link\b/i);
    assert.deepEqual(auditHtml(html), []);
  }
  const explicit = renderAnimation({ ...block(), motion: 'lively' }, { style: 'style-a' }).css;
  assert.match(explicit, easings['style-c']);
});

test('动画：同输入字节一致', async () => {
  const a = await generateNote(note);
  const b = await generateNote(note);
  assert.equal(a.html, b.html);
});

test('动画：timeline / state 预设可渲染', async () => {
  const timeline = {
    type: 'animation', id: 'http-timeline', preset: 'timeline', title: 'HTTP 版本演进',
    alt: 'HTTP 1.1 到 3 的里程碑动画', loop: true,
    steps: [
      { id: 'h1', label: 'HTTP/1.1', detail: '队头阻塞', hold: 1.4 },
      { id: 'h2', label: 'HTTP/2', detail: '多路复用', hold: 1.4 },
      { id: 'h3', label: 'HTTP/3', detail: 'QUIC', hold: 1.4 }
    ]
  };
  const state = {
    type: 'animation', id: 'tcp-state', preset: 'state', title: 'TCP 状态迁移',
    alt: 'TCP 从 LISTEN 到 ESTABLISHED 的状态迁移动画', loop: true,
    nodes: [{ id: 'listen', label: 'LISTEN' }, { id: 'synrcvd', label: 'SYN-RCVD' }, { id: 'est', label: 'ESTABLISHED' }],
    edges: [{ id: 'e1', from: 'listen', to: 'synrcvd', label: 'SYN' }, { id: 'e2', from: 'synrcvd', to: 'est', label: 'ACK' }],
    steps: [
      { id: 's1', label: '收到 SYN', focus: ['listen', 'e1'], hold: 2.0 },
      { id: 's2', label: '收到 ACK', focus: ['synrcvd', 'e2'], hold: 2.0 }
    ]
  };
  const n = clone(note);
  n.sections[2].blocks = [{ type: 'paragraph', text: '状态机与版本演进示例。' }, timeline];
  n.sections[3].blocks = [{ type: 'paragraph', text: '状态机示例。' }, state];
  const { html } = await generateNote(n);
  assert.match(html, /anim-http-timeline/);
  assert.match(html, /anim-tcp-state/);
  assert.doesNotThrow(() => auditHtml(html).filter(x => !x.includes('章节')));
});

test('动画：非法结构被拒绝', () => {
  const cases = [
    b => { b.preset = 'compare'; },
    b => { b.steps[0].focus = ['missing']; },
    b => { b.steps = b.steps.slice(0, 1); },
    b => { b.nodes = b.nodes.slice(0, 1); },
    b => { b.steps[0].label = 'x'.repeat(25); },
    b => { b.steps[0].hold = 0.1; },
    b => { b.id = 'bad id'; },
    b => { b.motion = 'frantic'; }
  ];
  for (const mutate of cases) {
    const b = block(); mutate(b);
    assert.throws(() => validateAnimation(b), /动画块/);
  }
});

test('动画：块 id 全笔记唯一', () => {
  const n = clone(note);
  const second = clone(n.sections[1].blocks[0]);
  n.sections[1].blocks.push(second);
  assert.throws(() => validateNote(n), /动画块 id 重复/);
});

test('动画：关键词能命中动画标签所在章节', async () => {
  const n = clone(note);
  n.keywords = ['SYN-RCVD'];
  const { html } = await generateNote(n);
  assert.match(html, /href="#section-handshake"/);
});

test('动画：默认 hold/loop 与 timeline 总时长', () => {
  const b = block();
  b.loop = undefined;
  b.steps = b.steps.map(({ hold, ...rest }) => rest);
  const n = normalizeAnimation(b);
  assert.equal(n.loop, true);
  assert.equal(n.steps.length, 3);
  assert.equal(n.steps[0].hold, 1.4);
  assert.equal(buildTotal(n), 4.2);
  function buildTotal(value) {
    return Number(value.steps.reduce((sum, step) => sum + step.hold, 0).toFixed(2));
  }
});

test('动画：state 自环也能生成路径', async () => {
  const b = {
    type: 'animation', id: 'self-loop', preset: 'state', title: '自环状态',
    alt: '一个状态通过自环回到自身', loop: true,
    nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    edges: [{ id: 'loop', from: 'a', to: 'a', label: 'retry' }, { id: 'ab', from: 'a', to: 'b', label: 'next' }],
    steps: [{ id: 's1', label: '自环', focus: ['a', 'loop'], hold: 2 }, { id: 's2', label: '前进', focus: ['b', 'ab'], hold: 2 }]
  };
  const { html } = renderAnimation(b);
  assert.match(html, /M 190 151 C 152 75, 268 75, 230 151/);
  assert.match(html, /data-edge="loop"/);
});

test('动画：标签转义，不执行 HTML', async () => {
  const b = block();
  b.title = 'A & B <script>';
  b.nodes[0].label = '<img src=x>';
  b.steps[0].label = '<b>bold</b>';
  const { html } = renderAnimation(b);
  assert.doesNotMatch(html, /<img|<script>|<b>bold/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.match(html, /&lt;b&gt;bold&lt;\/b&gt;/);
});

test('动画：两个块使用不同 marker id', async () => {
  const n = clone(note);
  const b2 = clone(n.sections[1].blocks[0]);
  b2.id = 'tcp-second';
  b2.title = 'TCP 第二次';
  b2.alt = '客户端与服务器之间第二次报文交换的动画示意';
  n.sections[1].blocks.push(b2);
  const { html } = await generateNote(n);
  assert.match(html, /anim-tcp-three-way-arrow/);
  assert.match(html, /anim-tcp-second-arrow/);
});

test('动画：缺少 aria-label 的 SVG 被审计拦下', () => {
  assert.ok(auditHtml('<svg><title>x</title></svg>').includes('SVG 缺少 aria-label'));
});

test('动画：无 focus 时仍渲染字幕与步骤列表', async () => {
  const b = block();
  for (const step of b.steps) step.focus = [];
  const { html } = renderAnimation(b);
  assert.doesNotMatch(html, /class="anim-focus"/);
  assert.match(html, /客户端发 SYN/);
  assert.match(html, /anim-steps/);
});

test('动画：loop=false 时动画只播放一次', async () => {
  const b = block();
  b.loop = false;
  const { css } = renderAnimation(b);
  assert.match(css, /animation-iteration-count:1/);
  assert.doesNotMatch(css, /animation-iteration-count:infinite/);
});

test('动画：timeline 不需要节点和边', async () => {
  const b = {
    type: 'animation', id: 'timeline-only', preset: 'timeline', title: '时间线',
    alt: '三个里程碑的时间线动画', loop: true,
    steps: [{ id: 'a', label: '第一', hold: 1.4 }, { id: 'b', label: '第二', hold: 1.4 }, { id: 'c', label: '第三', hold: 1.4 }]
  };
  const { html } = renderAnimation(b);
  assert.match(html, /anim-milestone/);
  assert.doesNotMatch(html, /data-edge=/);
});