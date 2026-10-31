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

// Width and height live in the JPEG SOF marker; link previews crop to 1.91:1, so the size is pinned.
const jpegSize = path => {
  const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
  for (let i = 2; i < bytes.length; i++) {
    if (bytes[i] !== 0xff) continue;
    const marker = bytes[i + 1];
    if (marker >= 0xc0 && marker <= 0xc2) return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    i += bytes.readUInt16BE(i + 2);
  }
  throw new Error(`${path}: no SOF marker`);
};

test('the share image is the finished hero at 1200x630 and ships with the site', () => {
  const head = html.match(/<head>([\s\S]*)<\/head>/)[1];
  assert.match(head, new RegExp(`<meta property="og:image" content="${SITE}assets/og-puente\\.jpg">`));
  assert.match(head, /<meta property="og:image:width" content="1200">/);
  assert.match(head, /<meta property="og:image:height" content="630">/);
  assert.match(head, /<meta property="og:image:alt" content="[^"]+">/);
  assert.match(head, /<meta name="twitter:card" content="summary_large_image">/);
  assert.deepEqual(jpegSize('assets/og-puente.jpg'), { width: 1200, height: 630 });
});

test('the home footer reaches the team by form, email and WhatsApp, and links the privacy policy', () => {
  const footer = html.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /href="\.\/contacto\/"/);
  assert.match(footer, new RegExp(`href="mailto:${CONTACT.email}"`));
  assert.match(footer, new RegExp(`href="https://wa\\.me/${CONTACT.whatsapp}\\?text=`));
  assert.match(footer, /href="\.\/privacidad\.html"/);
  assert.doesNotMatch(footer, /Envío pendiente/);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/, 'every build placeholder is filled');
});

test('the sitemap lists every public page with its absolute URL', () => {
  const sitemap = read('sitemap.xml');
  for (const page of ['', 'contacto/', 'privacidad.html']) {
    assert.match(sitemap, new RegExp(`<loc>${SITE}${page.replace('.', '\\.')}</loc>`));
  }
  assert.doesNotMatch(sitemap, /design\//);
});
