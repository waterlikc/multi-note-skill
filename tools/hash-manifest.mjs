import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const files = [
  'SKILL.md', 'package.json',
  'tests/runtime.test.mjs', 'tests/animation.test.mjs', 'tests/selfcheck.mjs',
  'src/animation/schema.mjs', 'src/animation/timeline.mjs', 'src/animation/layout.mjs', 'src/animation/svg.mjs',
  'examples/tcp-handshake.json', 'examples/tcp-handshake.html', 'examples/tcp-handshake.gif',
  'docs/概念动画.md'
];
for (const file of files) {
  const buffer = await readFile(join(root, file));
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  console.log(hash + '  ' + file);
}
