import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('landing keeps every major editorial section and real local artwork', () => {
  for (const id of ['contenido', 'top', 'problemas', 'que-hacemos', 'como-trabajamos', 'quienes-somos', 'preguntas', 'hablemos']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /assets\/footer-taller\.jpg/);
  // the hero bridge is drawn as dots from the original illustration
  assert.match(readFileSync(new URL('../src/hero-dots.mjs', import.meta.url), 'utf8'), /assets\/hero-puente-v2\.jpg/);
  for (const image of ['hero-puente-v2.jpg', 'footer-taller.jpg']) assert.ok(existsSync(new URL(`../assets/${image}`, import.meta.url)));
  assert.match(html, /Conectamos tus ideas con soluciones reales/);
  assert.match(html, /<script type="module" src="\.\/src\/landing\.mjs"><\/script>/);
});

test('landing exposes the canvas page-one structure and interactive illustrations', () => {
  for (const pattern of [
    /class="pains-band"/, /class="team-wrap/, /class="process-banner/, /class="wrap faq-grid/,
    /Tres formas de sacarte trabajo de encima</, /Las personas.*detrás de cada sistema</,
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
  // real destination (the team's confirmed address), no invented address and no response-time promise
  assert.match(form, /holapuentenea@gmail\.com/);
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

test('scroll reveal plays once, stays visible without JS and honors reduced motion', () => {
  const css = readFileSync(new URL('../styles/landing.css', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../src/landing.mjs', import.meta.url), 'utf8');
  // the JS class is set by the inline head script, before first paint
  assert.match(html.split('</head>')[0], /<script>[^<]*classList\.add\('js'\)/);
  // hidden initial state exists only behind .js and only when motion is allowed
  assert.doesNotMatch(css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n  \}\n/, ''), /^\s*\.reveal(-items)?[^{]*\{[^}]*opacity: 0/m);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\) \{\s*\.js \.reveal \{[^}]*opacity: 0[^}]*translateY\(28px\)/);
  assert.match(css, /\.js \.reveal-items > \* \{[^}]*opacity: 0/);
  // only compositor properties, one easing
  assert.doesNotMatch(css.match(/\.js \.reveal \{[^}]*\}/)[0], /(top|left|height|width|margin)\s*:|transition:[^;]*(height|width|margin)/);
  // observer reveals once, then stops watching
  assert.match(js, /classList\.add\('in'\)[\s\S]{0,40}io\.unobserve\(e\.target\)/);
  // reduced motion shows everything immediately
  assert.match(css, /prefers-reduced-motion: reduce\) \{[\s\S]*\.reveal[\s\S]*\.reveal-items > \*[\s\S]*opacity: 1/);
  // sibling groups opt in to the stagger
  assert.match(html, /class="problems reveal-items"/);
});

test('if the landing module never runs, the reveal gate lifts so content is not left hidden', () => {
  const tpl = readFileSync(new URL('../src/landing.template.html', import.meta.url), 'utf8');
  const head = tpl.match(/<head>([\s\S]*)<\/head>/)[1];
  assert.match(head, /setTimeout\([\s\S]*?reveal-ready[\s\S]*classList\.remove\('js'\)/);
  const js = readFileSync(new URL('../src/landing.mjs', import.meta.url), 'utf8');
  assert.match(js, /classList\.add\('reveal-ready'\)/);
});

test('team cards lead with their role, with no empty photo frames', () => {
  assert.doesNotMatch(html, /portrait empty/);
  assert.doesNotMatch(html, /Foto 4:5/);
  assert.doesNotMatch(html, /<h3[^>]*>\s*Equipo Puente NEA/);
  const members = html.match(/<article class="member[^"]*">[\s\S]*?<\/article>/g) ?? [];
  assert.equal(members.length, 2);
  const roles = ['Ingeniería y producto', 'Automatización e IA'];
  members.forEach((m, i) => assert.match(m, new RegExp(`<h3[^>]*>\\s*${roles[i]}\\s*</h3>`)));
});

test('servicios carousel sits between Qué hacemos and Cómo trabajamos with all seven services', () => {
  const at = id => html.indexOf(`id="${id}"`);
  assert.ok(at('que-hacemos') > -1 && at('servicios') > at('que-hacemos') && at('como-trabajamos') > at('servicios'));
  const section = html.match(/<section[^>]*id="servicios"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(section, /aria-labelledby="/);
  for (const title of ['Software a medida', 'Automatizaciones', 'Bots', 'Agentes', 'IA para tu negocio', 'Diseño de páginas web', 'Integraciones']) {
    assert.match(section, new RegExp(`<h3>${title}</h3>`));
  }
  assert.equal((section.match(/class="svc-card/g) ?? []).length, 7);
  assert.match(section, /<ul class="svc-track[^"]*"[^>]*aria-label="/);
  assert.match(section, /<button[^>]*aria-label="Servicio anterior"/);
  assert.match(section, /<button[^>]*aria-label="Servicio siguiente"/);
  // the process banner right below owns the "Contanos qué necesitás" button; here it is a quiet text link
  assert.doesNotMatch(section, /Contanos qué necesitás|class="btn/);
  assert.match(section, /<p class="lead">[^<]*<a href="\.\/hablemos\.html">contanos<\/a><\/p>/);
  assert.doesNotMatch(section, /class="num"|Siete formas/);
});

test('carousel behaviour lives in src/carousel.mjs, is wired from landing.mjs and is not autoplay', () => {
  assert.ok(existsSync(new URL('../src/carousel.mjs', import.meta.url)));
  const main = readFileSync(new URL('../src/landing.mjs', import.meta.url), 'utf8');
  assert.match(main, /from "\.\/carousel\.mjs"/);
  const js = readFileSync(new URL('../src/carousel.mjs', import.meta.url), 'utf8');
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js, /setInterval|setTimeout/);
  const styles = readFileSync(new URL('../styles/landing.css', import.meta.url), 'utf8');
  assert.match(styles, /\.svc-track \{[^}]*scroll-snap-type: x mandatory/);
  assert.match(styles, /:root, \.figure, \.svc-card/);
});

test('each service card shows its real screenshot with dimensions and a description', () => {
  const names = ['software-a-medida', 'automatizaciones', 'bots', 'agentes', 'ia-para-tu-negocio', 'diseno-web', 'integraciones'];
  for (const name of names) {
    const src = `./assets/servicios/${name}.jpg`;
    const tag = html.match(new RegExp(`<img[^>]*src="${src.replace(/[./]/g, '\\$&')}"[^>]*>`))?.[0] ?? '';
    assert.ok(tag, `${name}: <img> missing from index.html`);
    assert.match(tag, /width="720"/);
    assert.match(tag, /height="1080"/);
    assert.match(tag, /alt="[^"]+"/);
    assert.ok(existsSync(new URL(`../assets/servicios/${name}.jpg`, import.meta.url)), `${name}.jpg missing on disk`);
  }
  assert.doesNotMatch(html, /class="vg"/);
});

test('in the contact form only the person name is required, the business name is optional', () => {
  const form = readFileSync(new URL('../hablemos.html', import.meta.url), 'utf8');
  assert.match(form, /<input id="name" name="name"[^>]*\brequired\b/);
  const business = form.match(/<input id="business"[^>]*>/)?.[0] ?? '';
  assert.ok(business, 'business input exists');
  assert.doesNotMatch(business, /\brequired\b/);
  assert.match(form, /<label for="business">Nombre del negocio \(opcional\)<\/label>/);
  const js = readFileSync(new URL('../src/contact.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /field\.name === 'business'/);
});

test('below 900px a menu button opens the section links; the dead main.mjs menu is gone', () => {
  const button = html.match(/<button class="menu-toggle"[^>]*>/)?.[0] ?? '';
  assert.ok(button, 'menu button exists');
  assert.match(button, /aria-expanded="false"/);
  assert.match(button, /aria-controls="nav-menu"/);
  assert.match(button, /aria-label="Menú"/);
  assert.match(html, /<ul id="nav-menu">/);
  assert.match(html, /<script type="module" src="\.\/src\/nav\.mjs"><\/script>/);
  const styles = css('landing.css');
  assert.match(styles, /\.menu-toggle \{[^}]*display: none/);
  assert.match(styles, /@media \(max-width: 900px\) \{[\s\S]*?\.menu-toggle \{ display: grid; \}/);
  const nav = readFileSync(new URL('../src/nav.mjs', import.meta.url), 'utf8');
  assert.match(nav, /Escape/);
  assert.ok(!existsSync(new URL('../src/main.mjs', import.meta.url)));
});

test('the home describes itself to search engines and link previews', () => {
  const head = html.match(/<head>([\s\S]*)<\/head>/)[1];
  assert.match(head, /<meta name="description" content="[^"]{70,160}">/);
  for (const p of ['og:title', 'og:description', 'og:type', 'og:locale', 'og:site_name']) {
    assert.match(head, new RegExp(`<meta property="${p}" content="[^"]+">`));
  }
});

test('the contact page never implies the business name is required', () => {
  const form = readFileSync(new URL('../hablemos.html', import.meta.url), 'utf8');
  assert.doesNotMatch(form, /Nombre, negocio/);
});

test('the hero bridge is a dot matrix behind the copy, without the old panels and hotspots', () => {
  const hero = html.match(/<header class="hero"[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(hero, /<canvas class="hero-dots" role="img" aria-label="[^"]*puente[^"]*"/i);
  assert.ok(hero.indexOf('hero-copy') < hero.indexOf('hero-dots') || /hero-scene/.test(hero));
  assert.doesNotMatch(hero, /class="spot"|class="legend"|class="overlay"|<img/);
  const js = readFileSync(new URL('../src/landing.mjs', import.meta.url), 'utf8');
  assert.match(js, /import \{ initHeroDots \} from "\.\/hero-dots\.mjs"/);
  assert.doesNotMatch(js, /\.spot button/);
  const dots = readFileSync(new URL('../src/hero-dots.mjs', import.meta.url), 'utf8');
  assert.match(dots, /prefers-reduced-motion/);
  assert.match(dots, /IntersectionObserver/);
  assert.doesNotMatch(css('landing.css'), /\.spot|\.legend|\.hero-stage/);
});

test('the hero carries the brief copy and its two CTAs', () => {
  const hero = html.match(/<header class="hero"[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(hero, /<span class="eyebrow">Tecnología que conecta<\/span>/);
  assert.match(hero, /<h1 id="hero-title" aria-label="Conectamos tus ideas con soluciones reales">Conectamos tus ideas con soluciones reales<\/h1>/);
  assert.match(hero, /Desarrollamos software a medida, automatizaciones e inteligencia artificial para que tu negocio trabaje mejor y siga creciendo\./);
  assert.match(hero, /<a class="btn btn-primary" href="\.\/hablemos\.html">Hablemos de tu proyecto <span class="arrow" aria-hidden="true">→<\/span><\/a>/);
  assert.match(hero, /<a class="btn btn-ghost" href="#servicios">Explorá nuestros servicios<\/a>/);
  assert.match(html, /id="servicios"/);
});

test('the hero bridge builds once, pauses when hidden and keeps cursor effects to fine pointers', () => {
  const dots = readFileSync(new URL('../src/hero-dots.mjs', import.meta.url), 'utf8');
  assert.match(dots, /visibilitychange/);
  assert.match(dots, /hover: hover\) and \(pointer: fine/);
  assert.match(css('landing.css'), /\.hero-scene[^}]*mask-image/);
});
