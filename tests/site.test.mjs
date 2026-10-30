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
