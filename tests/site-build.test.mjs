import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'puente-site-'));
execFileSync(process.execPath, [join(root, 'scripts/build-site.mjs'), out], { stdio: 'pipe' });
test.after(() => rmSync(out, { recursive: true, force: true }));

const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(out).map(path => relative(out, path));

test('the published folder holds the pages and what they load', () => {
  for (const file of ['index.html', 'hablemos.html', 'contacto/index.html', 'privacidad.html', 'sitemap.xml', 'assets/hero-puente-v2.jpg', 'styles/landing.css', 'src/landing.mjs', 'src/contact-message.mjs', 'src/figures/ai.mjs']) {
    assert.ok(files.includes(file), `missing ${file}`);
  }
});

test('nothing internal is published', () => {
  for (const prefix of ['design/', 'odd/', 'tests/', 'scripts/', '.github/', '.checks/']) {
    assert.ok(!files.some(file => file.startsWith(prefix)), `published ${prefix}`);
  }
  for (const file of ['README.md', 'AGENTS.md', '.gitignore', 'src/pages/index.html', 'src/partials/nav.html', 'src/figures/ai.html']) {
    assert.ok(!files.includes(file), `published ${file}`);
  }
});

test('every local link, script, style and image resolves inside the published folder', () => {
  const missing = [];
  const check = (from, ref) => {
    const path = ref.split(/[?#]/)[0];
    if (!path) return;
    const target = join(from, path);
    if (!target.startsWith(out) || !existsSync(target)) missing.push(`${relative(out, from) || '.'}: ${ref}`);
  };
  for (const file of files.filter(f => f.endsWith('.html'))) {
    // comments document future assets (like team photos) and are not loaded
    const html = readFileSync(join(out, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const [, ref] of html.matchAll(/(?:src|href)="(\.{1,2}\/[^"]*)"/g)) check(dirname(join(out, file)), ref);
  }
  for (const file of files.filter(f => f.endsWith('.mjs'))) {
    const js = readFileSync(join(out, file), 'utf8');
    for (const [, ref] of js.matchAll(/from ['"](\.{1,2}\/[^'"]+)['"]/g)) check(dirname(join(out, file)), ref);
    // asset URLs in modules resolve against the page, which sits at the site root
    for (const [, ref] of js.matchAll(/['"](\.\/assets\/[^'"]+)['"]/g)) check(out, ref);
  }
  assert.deepEqual(missing, []);
});

test('the Pages workflow runs the tests before publishing only the built folder', () => {
  const yml = readFileSync(join(root, '.github/workflows/pages.yml'), 'utf8');
  const at = step => yml.indexOf(step);
  assert.ok(at('node --test') > -1 && at('node --test') < at('node scripts/build-site.mjs'));
  assert.ok(at('node scripts/build-site.mjs') < at('actions/upload-pages-artifact'));
  assert.match(yml, /path: _site/);
  assert.match(yml, /branches: \[master\]/);
  assert.match(readFileSync(join(root, '.gitignore'), 'utf8'), /^_site\/$/m);
});
