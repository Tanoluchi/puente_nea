import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the pains band is one compact moving row with no visible pause button', () => {
  const tpl = read('index.html');
  assert.doesNotMatch(tpl, /pains-toggle/);
  // keyboard users can reach the row; focusing it pauses the motion (WCAG 2.2.2)
  assert.match(tpl, /<div class="pains-viewport" tabindex="0">/);
  assert.match(tpl, /<script type="module" src="\.\/src\/pains\.mjs"><\/script>/);
  const js = read('src/pains.mjs');
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /setAttribute\('aria-hidden', 'true'\)/); // the loop copy is hidden from screen readers
  assert.match(js, /classList\.add\('is-moving'\)/);
  assert.match(js, /\(hover: none\)/); // touch: a tap pauses and resumes
  assert.doesNotMatch(js, /pains-toggle/);
});

test('it moves only when the script enables it, pauses on hover, focus or tap, and highlights the chip under the pointer', () => {
  const css = read('styles/landing.css');
  assert.match(css, /\.pains-band\.is-moving \.pains-track \{ animation: pains /);
  // hover pause only with a real pointer (touch keeps :hover stuck after a tap); focus pause only from the keyboard
  assert.match(css, /@media \(hover: hover\) \{ \.pains-band\.is-moving \.pains-viewport:hover \.pains-track \{ animation-play-state: paused; \} \}/);
  assert.match(css, /\.pains-band\.is-moving \.pains-viewport:focus-visible \.pains-track, \.pains-band\.is-paused \.pains-track \{ animation-play-state: paused; \}/);
  assert.doesNotMatch(css, /\.pains-viewport:focus \.pains-track/);
  assert.match(css, /\.pains-track li:hover \{[^}]*background: var\(--terra-tint\)/);
  assert.match(css, /\.pains-track \{[^}]*flex-wrap: nowrap/);
  assert.doesNotMatch(css, /pains-toggle/);
});
