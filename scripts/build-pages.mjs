// Builds every page from src/pages/, src/partials/ and src/figures/.
// A page file starts with a `<!-- page {...} -->` config block; the rest is its body.
// Also writes sitemap.xml, so the page list cannot drift from what is published.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTACT, whatsappHref } from '../src/contact-message.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://tanoluchi.github.io/puente_nea/';
const read = path => readFileSync(join(root, path), 'utf8');
const partial = name => read(`src/partials/${name}.html`);

export const PAGES = readdirSync(join(root, 'src/pages'))
  .filter(name => name.endsWith('.html'))
  .map(name => {
    const source = read(`src/pages/${name}`);
    const config = source.match(/^<!-- page ([\s\S]*?) -->\n/);
    if (!config) throw new Error(`src/pages/${name}: missing the <!-- page {...} --> config`);
    return { ...JSON.parse(config[1]), body: source.slice(config[0].length) };
  });

// The absolute URL a page is published at: folder pages end in a slash.
const urlOf = out => SITE + (out === 'index.html' ? '' : out.replace(/index\.html$/, ''));

function fill(html, values) {
  return html.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown placeholder {{${key}}}`);
    return values[key];
  });
}

function render(page) {
  const base = '../'.repeat(page.depth ?? 0) || './';
  // Figures are shared fragments; only the marker of a page that shows one is replaced.
  let body = page.body.replace(/<!-- FIGURE_(SOFTWARE|AUTO|AI) -->/g, (_, name) => read(`src/figures/${name.toLowerCase()}.html`));

  const extraHead = (page.styles ?? []).map(style => `<link rel="stylesheet" href="${base}styles/${style}">`).join('\n');
  const scripts = ['src/theme.mjs', 'src/nav.mjs', 'src/page.mjs', ...(page.scripts ?? [])]
    .map(script => `<script type="module" src="${base}${script}"></script>`)
    .join('\n');

  return fill([
    partial('head'),
    '<body>',
    partial('isotipo'),
    partial('nav'),
    body,
    partial('footer'),
    scripts,
    '</body>',
    '</html>',
    '',
  ].join('\n'), {
    SITE,
    BASE: base,
    EXTRA_HEAD: extraHead,
    PAGE_URL: urlOf(page.out),
    TITLE: page.title,
    DESCRIPTION: page.description,
    OG_TITLE: page.ogTitle ?? page.title,
    OG_DESCRIPTION: page.ogDescription ?? page.description,
    CONTACT_EMAIL: CONTACT.email,
    WHATSAPP_HREF: whatsappHref('Hola, quiero hacer una consulta'),
  });
}

export function build() {
  for (const page of PAGES) {
    const target = join(root, page.out);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, render(page));
  }
  const entries = PAGES.filter(page => page.sitemap !== false)
    .map(page => `  <url><loc>${urlOf(page.out)}</loc></url>`)
    .join('\n');
  writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  return PAGES.map(page => page.out);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outs = build();
  console.log(`Built ${outs.length} pages: ${outs.join(', ')}`);
}
