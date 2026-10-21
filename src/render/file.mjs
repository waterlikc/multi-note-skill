import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { generateNote } from './note.mjs';

export async function renderFile(input, output, stateFile) {
  let temp;
  try {
    if (!input || !output) throw new Error('用法：node cli/note.mjs render 输入.json 输出.html [状态.json]');
    if (resolve(input) === resolve(output) || (stateFile && resolve(stateFile) === resolve(output))) throw new Error('输出不能覆盖输入');
    const data = JSON.parse(await readFile(input, 'utf8'));
    const embeddedState = data?.note && data?.graph ? data : undefined;
    const note = embeddedState ? embeddedState.note : data;
    const state = stateFile ? JSON.parse(await readFile(stateFile, 'utf8')) : embeddedState;
    const { html } = await generateNote(note, state);
    temp = output + '.' + randomUUID() + '.tmp';
    await writeFile(temp, html, 'utf8');
    await rename(temp, output);
    return output;
  } catch (error) {
    if (temp) await unlink(temp).catch(() => {});
    throw error;
  }
}
