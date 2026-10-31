// The site is multi-page now: these pin what a link between pages must guarantee.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../scripts/build-pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const SITE = 'https://tanoluchi.github.io/puente_nea/';
const published = PAGES.map(page => page.out);

test('every page ships one h1, the shared nav and its own canonical url', () => {
  for (const page of PAGES) {
    const html = read(page.out);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${page.out} must have exactly one h1`);
    assert.match(html, /<nav class="nav" aria-label="Principal">/, `${page.out} must carry the shared nav`);
    assert.match(html, /<footer/, `${page.out} must carry the shared footer`);
    const url = SITE + (page.out === 'index.html' ? '' : page.out.replace(/index\.html$/, ''));
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${page.out} must point canonical at ${url}`);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`), `${page.out} must point og:url at ${url}`);
  }
});

test('the footer links the pages that exist, from any depth', () => {
  for (const { out, depth } of PAGES) {
    const base = '../'.repeat(depth) || './';
    const html = read(out);
    const footer = html.slice(html.indexOf('<footer'));
    for (const page of ['servicios/', 'como-trabajamos/', 'servicios/software-a-medida/', 'servicios/automatizaciones/', 'servicios/inteligencia-artificial/']) {
      assert.ok(footer.includes(`href="${base}${page}"`), `${out} footer must link ${base}${page}`);
    }
    assert.doesNotMatch(footer, /index\.html#que-hacemos|index\.html#como-trabajamos/, out);
  }
});

test('no internal link, stylesheet or script points at a file that does not exist', () => {
  const missing = [];
  for (const page of PAGES) {
    // comments hold authoring hints such as the future team photos, not live references
    const html = read(page.out).replace(/<!--[\s\S]*?-->/g, '');
    const dir = dirname(join(root, page.out));
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(#|https?:|mailto:|tel:|data:)/.test(ref)) continue;
      const [path] = ref.split('#');
      if (!path) continue;
      const target = join(dir, path);
      const ok = existsSync(target) || existsSync(join(target, 'index.html'));
      if (!ok) missing.push(`${page.out} -> ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('the sitemap lists every published page and leaves the hablemos.html redirect out', () => {
  const sitemap = read('sitemap.xml');
  for (const page of PAGES) {
    if (page.sitemap === false) continue;
    const url = SITE + (page.out === 'index.html' ? '' : page.out.replace(/index\.html$/, ''));
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap must list ${url}`);
  }
  assert.doesNotMatch(sitemap, /hablemos\.html/);
  assert.match(read('hablemos.html'), /http-equiv="refresh" content="0; url=\.\/contacto\/"/);
});

test('each service page shows its own demo and links the other two', () => {
  const services = [
    { out: 'servicios/software-a-medida/index.html', figure: 'software', others: ['automatizaciones', 'inteligencia-artificial'] },
    { out: 'servicios/automatizaciones/index.html', figure: 'auto', others: ['software-a-medida', 'inteligencia-artificial'] },
    { out: 'servicios/inteligencia-artificial/index.html', figure: 'ai', others: ['software-a-medida', 'automatizaciones'] },
  ];
  for (const service of services) {
    const html = read(service.out);
    assert.match(html, new RegExp(`<main id="contenido" data-figure="${service.figure}">`), `${service.out} must load the ${service.figure} demo`);
    assert.match(html, /class="figure"/, `${service.out} must render the demo frame`);
    // the shared Anatomy kit must load before the figure's own palette, or every shape falls back to black
    assert.match(html, /href="\.\.\/\.\.\/styles\/figures\/iso\.css"/, `${service.out} must load the shared figure kit`);
    assert.ok(
      html.indexOf('styles/figures/iso.css') < html.indexOf(`styles/figures/${service.figure}.css`),
      `${service.out} must load figures/iso.css before figures/${service.figure}.css`,
    );
    for (const other of service.others) {
      assert.ok(html.includes(`href="../../servicios/${other}/"`), `${service.out} must link ../../servicios/${other}/`);
    }
  }
});

test('the hub links every service page', () => {
  const hub = read('servicios/index.html');
  for (const slug of ['software-a-medida', 'automatizaciones', 'inteligencia-artificial']) {
    assert.ok(hub.includes(`href="../servicios/${slug}/"`), `hub must link ../servicios/${slug}/`);
  }
});

test('the process page keeps the five steps in order', () => {
  const process = read('como-trabajamos/index.html');
  const steps = ['Nos contás tu problema o idea', 'Analizamos tus necesidades', 'Diseñamos una solución', 'Desarrollamos y validamos', 'Implementamos y acompañamos'];
  assert.equal((process.match(/<li>\s*<span class="n"/g) ?? []).length, 5);
  steps.forEach((step, i) => assert.ok(process.indexOf(step) > 0, `process page must keep the step "${step}"`));
  steps.slice(1).forEach((step, i) => assert.ok(process.indexOf(step) > process.indexOf(steps[i]), `step "${step}" must come after "${steps[i]}"`));
});

test('the nav points at the hub pages from every depth', () => {
  for (const page of PAGES) {
    const base = '../'.repeat(page.depth ?? 0) || './';
    const html = read(page.out);
    assert.ok(html.includes(`<a href="${base}servicios/">Servicios</a>`), `${page.out} nav must resolve to ${base}servicios/`);
    assert.ok(html.includes(`<a href="${base}como-trabajamos/">Cómo trabajamos</a>`), `${page.out} nav must resolve to ${base}como-trabajamos/`);
    assert.ok(html.includes(`<a class="btn btn-primary" href="${base}contacto/">Hablemos</a>`), `${page.out} CTA must resolve to ${base}contacto/`);
  }
});

test('every page loads the shared page module, which runs its own reveal and demo', () => {
  const js = read('src/page.mjs');
  assert.match(js, /^initPage\(\);$/m);
  for (const page of PAGES) {
    const html = read(page.out);
    const base = '../'.repeat(page.depth ?? 0) || './';
    assert.ok(html.includes(`src="${base}src/page.mjs"`), `${page.out} must load ${base}src/page.mjs`);
  }
});

test('the home keeps one diagnosis, five linked steps and no stale form copy', () => {
  const home = read('index.html');
  // the pains band now opens the problems section instead of owning its own one
  const problems = home.match(/<section id="problemas"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(problems, /class="pains-band"/);
  assert.equal((home.match(/class="pains-band"/g) ?? []).length, 1);
  // five steps that match the process page, each linking to it
  const rail = home.match(/<ol class="rail reveal-items">[\s\S]*?<\/ol>/)?.[0] ?? '';
  assert.equal((rail.match(/<li>/g) ?? []).length, 5);
  assert.match(home, /href="\.\/como-trabajamos\/">Ver cómo trabajamos/);
  assert.doesNotMatch(home, /class="steps"/);
  // nothing on the home claims the form does not send
  assert.doesNotMatch(home, /todavía no envía|no está habilitado/);
  // one label for the main call to action inside the page (the nav keeps its short "Hablemos")
  const main = home.slice(home.indexOf('<main'), home.indexOf('</main>'));
  const ctas = main.match(/class="btn btn-primary"[^>]*>([^<]+)/g) ?? [];
  assert.ok(ctas.length >= 2);
  for (const cta of ctas) assert.match(cta, />Hablemos de tu proyecto/);
  // every carousel card leads somewhere
  const cards = home.match(/<li class="svc-card">[\s\S]*?<\/li>/g) ?? [];
  assert.equal(cards.length, 7);
  for (const card of cards) assert.match(card, /<a class="link" href="(?:\.\/servicios\/|\.\/contacto\/)/);
});
