import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('landing keeps every major editorial section and real local artwork', () => {
  for (const id of ['contenido', 'top', 'problemas', 'que-hacemos', 'como-trabajamos', 'quienes-somos', 'preguntas', 'hablemos']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const image of ['hero-puente-v2.jpg', 'footer-taller.jpg']) {
    assert.match(html, new RegExp(`assets/${image}`));
    assert.ok(existsSync(new URL(`../assets/${image}`, import.meta.url)));
  }
  assert.match(html, /Software a medida, automatización e/);
  assert.match(html, /<script type="module" src="\.\/src\/landing\.mjs"><\/script>/);
});

test('landing exposes the canvas page-one structure and interactive illustrations', () => {
  for (const pattern of [
    /class="pains-band"/, /class="team-wrap/, /class="process-banner/, /class="wrap faq-grid/,
    /Tres formas de sacarte trabajo de encima\./, /Las personas.*detrás de cada sistema\./,
    /id="fig-ba"/, /id="fig-flow"/, /id="fig-bot"/,
    /class="iso pn-sw/, /class="iso pa-au/, /class="iso pi-br/,
  ]) assert.match(html, pattern);
  for (const name of ['software', 'auto', 'ai']) {
    assert.ok(existsSync(new URL(`../src/figures/${name}.mjs`, import.meta.url)));
    assert.ok(existsSync(new URL(`../styles/figures/${name}.css`, import.meta.url)));
  }
});

test('every contact call to action opens a separate, honest three-step form', () => {
  assert.doesNotMatch(html, /04-hablemos\.html|hola@puentenea\.com|Nombre Apellido|href="#hablemos"/);
  assert.ok((html.match(/href="\.\/hablemos\.html"/g) || []).length >= 5);
  const form = readFileSync(new URL('../hablemos.html', import.meta.url), 'utf8');
  for (const name of ['name', 'business', 'channel', 'contact', 'topic', 'problem']) {
    assert.match(form, new RegExp(`name="${name}"`));
  }
  assert.match(form, /envío todavía no está habilitado/i);
  assert.doesNotMatch(form, /hola@puentenea\.com|menos de 24 h|tu consulta le llega/);
});

const css = (path) => readFileSync(new URL(`../styles/${path}`, import.meta.url), 'utf8');

test('both pages share one token set and the same button components', () => {
  const form = readFileSync(new URL('../hablemos.html', import.meta.url), 'utf8');
  for (const page of [html, form]) assert.match(page, /href="\.\/styles\/landing\.css"/);
  assert.ok(!existsSync(new URL('../styles/site.css', import.meta.url)));
  assert.doesNotMatch(form, /class="button\b/);
  assert.match(form, /class="btn btn-primary"/);
  assert.doesNotMatch(css('contact.css'), /var\(--(paper|ink-soft|river|sun)\)/);
});

test('white text never sits on the light terra (3.93:1); it uses the AA terra ink', () => {
  for (const file of ['landing.css', 'contact.css', 'figures/auto.css', 'figures/ai.css', 'figures/software.css']) {
    for (const rule of css(file).match(/\{[^{}]*\}/g)) {
      assert.ok(!(/background: ?var\(--terra\)[;\s]/.test(rule) && /color: ?#fff\b/.test(rule)), `${file}: ${rule.slice(0, 90)}`);
    }
  }
});

test('dark mode is a toggle that redefines the shared tokens', () => {
  const dark = css('landing.css').match(/:root\[data-theme="dark"\] \{([^}]*)\}/);
  assert.ok(dark, 'landing.css needs a :root[data-theme="dark"] token block');
  assert.doesNotMatch(css('landing.css'), /@media \(prefers-color-scheme: dark\)/);
  for (const token of ['--cream', '--paper', '--line', '--ink', '--ink-2', '--terra-ink', '--surface']) {
    assert.match(dark[1], new RegExp(`${token}:`));
  }
  assert.match(dark[1], /color-scheme: dark;/);
  const form = readFileSync(new URL('../hablemos.html', import.meta.url), 'utf8');
  for (const page of [html, form]) {
    // light is the default; only a saved dark choice switches the theme, in <head> before paint
    assert.match(page, /<head>[\s\S]*localStorage\.getItem\('theme'\) === 'dark'[\s\S]*<\/head>/);
    assert.doesNotMatch(page, /prefers-color-scheme/);
    assert.match(page, /<button class="theme-toggle" type="button" aria-pressed="false" aria-label="Modo oscuro">/);
    assert.match(page, /<script type="module" src="\.\/src\/theme\.mjs"><\/script>/);
  }
  assert.doesNotMatch(css('contact.css'), /background:#fff\b|#fff2e9|#fff3e9|#fce5d7/);
  // outside the light-scoped illustrations, text on accent/petrol fills must not be tied to a token that flips in dark mode
  for (const rule of css('landing.css').match(/\{[^{}]*\}/g)) {
    assert.ok(!(/background: var\(--terra-ink\)/.test(rule) && /color: #fff\b/.test(rule)), rule.slice(0, 90));
    assert.ok(!(/background: var\(--petrol\)/.test(rule) && /color: var\(--cream\)/.test(rule)), rule.slice(0, 90));
  }
});
