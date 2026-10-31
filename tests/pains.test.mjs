import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the pains band is one compact moving row that can be paused', () => {
  const tpl = read('src/landing.template.html');
  const band = tpl.match(/<div class="pains-band"[\s\S]*?<\/ul>\s*<\/div>[\s\S]*?<\/div>/)?.[0] ?? '';
  assert.match(band, /<button class="pains-toggle" type="button" aria-pressed="false" aria-label="Pausar el movimiento">/);
  assert.match(tpl, /<script type="module" src="\.\/src\/pains\.mjs"><\/script>/);
  const js = read('src/pains.mjs');
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /setAttribute\('aria-hidden', 'true'\)/); // the loop copy is hidden from screen readers
  assert.match(js, /classList\.add\('is-moving'\)/);
});

test('it moves only when the script enables it, pauses over the chips or with the button, and highlights the chip under the pointer', () => {
  const css = read('styles/landing.css');
  assert.match(css, /\.pains-band\.is-moving \.pains-track \{ animation: pains /);
  // hover pauses only over the chips: the pause button sits in the band, and pressing "resume" must resume
  assert.match(css, /\.pains-band\.is-moving \.pains-viewport:hover \.pains-track, \.pains-band\.is-paused \.pains-track \{ animation-play-state: paused; \}/);
  assert.doesNotMatch(css, /\.pains-band\.is-moving:(hover|focus-within)/);
  assert.match(css, /\.pains-track li:hover \{[^}]*background: var\(--terra-tint\)/);
  assert.match(css, /\.pains-track \{[^}]*flex-wrap: nowrap/);
  assert.doesNotMatch(css, /\.pains-track \{[^}]*flex-wrap: wrap/);
});
