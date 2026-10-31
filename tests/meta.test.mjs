import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CONTACT } from '../src/contact-message.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const SITE = 'https://tanoluchi.github.io/puente_nea/';
const html = read('index.html');

test('the home declares its public URL', () => {
  const head = html.match(/<head>([\s\S]*)<\/head>/)[1];
  assert.match(head, new RegExp(`<link rel="canonical" href="${SITE}">`));
  assert.match(head, new RegExp(`<meta property="og:url" content="${SITE}">`));
});

test.todo('share image (og:image 1200x630) rendered from the finished hero');

test('the home footer reaches the team by form, email and WhatsApp, and links the privacy policy', () => {
  const footer = html.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /href="\.\/hablemos\.html"/);
  assert.match(footer, new RegExp(`href="mailto:${CONTACT.email}"`));
  assert.match(footer, new RegExp(`href="https://wa\\.me/${CONTACT.whatsapp}\\?text=`));
  assert.match(footer, /href="\.\/privacidad\.html"/);
  assert.doesNotMatch(footer, /Envío pendiente/);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/, 'every build placeholder is filled');
});

test('the sitemap lists every public page with its absolute URL', () => {
  const sitemap = read('sitemap.xml');
  for (const page of ['', 'hablemos.html', 'privacidad.html']) {
    assert.match(sitemap, new RegExp(`<loc>${SITE}${page.replace('.', '\\.')}</loc>`));
  }
  assert.doesNotMatch(sitemap, /design\//);
});
