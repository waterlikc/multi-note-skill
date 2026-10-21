import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createState, generateNote, summarisePractice, reviewSchedule } from '../index.mjs';
import { cardsFromNote, toCsv, withBom } from '../src/export/cards.mjs';
import { buildPlan, renderPlanHtml } from '../src/export/plan.mjs';

const NL = String.fromCharCode(10);
const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, '..', 'examples', 'advanced');
const note = JSON.parse(await readFile(join(root, '..', 'examples', 'advanced-math.json'), 'utf8'));
const graph = {
  nodes: [
    { id: 'slope', label: '斜率', sectionIds: ['concept'], mastery: 'learning', evidence: ['课堂自测第 2 题答对'] },
    { id: 'linear-example', label: '一次函数计算', sectionIds: ['example'], mastery: 'review', evidence: ['横坐标相同的情况答错，需重做'] },
    { id: 'self-test', label: '自测与答案', sectionIds: ['quiz'], mastery: 'unknown', evidence: [] }
  ],
  edges: [
    { from: 'slope', to: 'linear-example', type: 'prerequisite', basis: '例题需要先理解斜率定义（教学建议）' },
    { from: 'linear-example', to: 'self-test', type: 'prerequisite', basis: '自测检验计算是否熟练（教学建议）' }
  ]
};
const state = createState(note, graph);
const { html } = await generateNote(note, state);
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'math-objectives.html'), html, 'utf8');
await writeFile(join(outDir, 'math-objectives.state.json'), JSON.stringify(state, null, 2) + NL, 'utf8');
await writeFile(join(outDir, 'cards.csv'), withBom(toCsv(cardsFromNote(note))), 'utf8');
const plan = buildPlan(state, { days: 5 });
await writeFile(join(outDir, 'plan.html'), renderPlanHtml(state, plan, 5), 'utf8');
const summary = summarisePractice(note);
console.log(JSON.stringify({ htmlBytes: html.length, cards: cardsFromNote(note).length - 1, planDays: plan.length, real: summary.real, simulated: summary.simulated, schedule: reviewSchedule(note).map(r => r.days) }));