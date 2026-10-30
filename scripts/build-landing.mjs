import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let html = readFileSync(join(root, 'src/landing.template.html'), 'utf8');
for (const name of ['software', 'auto', 'ai']) {
  const marker = `<!-- FIGURE_${name.toUpperCase()} -->`;
  if (!html.includes(marker)) throw new Error(`Missing ${marker}`);
  html = html.replace(marker, readFileSync(join(root, `src/figures/${name}.html`), 'utf8'));
}
writeFileSync(join(root, 'index.html'), html);
