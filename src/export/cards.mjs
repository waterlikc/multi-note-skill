import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { validateNote } from '../render/note.mjs';

// CSV 单元格：去掉换行，含逗号或引号时加引号并转义。
function cell(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return /[",]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

export function cardsFromNote(note) {
  validateNote(note);
  const rows = [['front', 'back', 'tags', 'source']];
  for (const objective of note.objectives ?? []) {
    rows.push([objective.text, objective.criteria.join('；'), 'objective', objective.id]);
  }
  for (const section of note.sections) {
    const first = section.blocks.find(block => block.type === 'paragraph' || block.type === 'callout');
    if (!first) continue;
    rows.push([section.heading, first.text.slice(0, 200), note.scene, section.sourceIds.length ? section.sourceIds.join(' ') : '补充解释']);
  }
  return rows;
}

export function withBom(csv) { return '\uFEFF' + csv; }

export function toCsv(rows) {
  return rows.map(row => row.map(cell).join(',')).join('\n') + '\n';
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}
