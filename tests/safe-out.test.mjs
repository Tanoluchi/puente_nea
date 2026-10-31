import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unsafeOut } from '../scripts/safe-out.mjs';

// Pure check, no deletion: the build wipes its output folder, so only <repo>/_site or a folder outside the repo is allowed.
const base = mkdtempSync(join(tmpdir(), 'safe-out-'));
const root = join(base, 'real', 'repo');
mkdirSync(join(root, 'src'), { recursive: true });
symlinkSync(join(base, 'real'), join(base, 'link')); // like macOS /var -> /private/var
const dotted = join(base, '..dots', 'repo'); // a parent folder whose name starts with ".."
mkdirSync(dotted, { recursive: true });
test.after(() => rmSync(base, { recursive: true, force: true }));

test('the repository, its parents and the filesystem root are refused, also through a symlink', () => {
  for (const out of [root, `${root}/`, join(base, 'real'), base, '/', join(base, 'link'), join(base, 'link', 'repo')]) {
    assert.equal(unsafeOut(out, root), true, out);
  }
});

test('folders inside the repository other than _site are refused', () => {
  for (const out of [join(root, 'src'), join(root, 'src', 'new'), join(root, 'scripts'), join(root, '.git')]) {
    assert.equal(unsafeOut(out, root), true, out);
  }
});

test('a parent named "..something" still counts as a parent', () => {
  assert.equal(unsafeOut(base, dotted), true);
  assert.equal(unsafeOut(join(base, '..dots'), dotted), true);
});

test('a case-variant spelling of the repository is refused on case-insensitive filesystems', t => {
  const upper = join(base, 'real', 'REPO');
  if (!existsSync(upper)) return t.skip('case-sensitive filesystem');
  assert.equal(unsafeOut(upper, root), true);
  assert.equal(unsafeOut(join(base, 'REAL'), root), true);
});

test('<repo>/_site and folders outside the repository are allowed, even if they do not exist yet', () => {
  for (const out of [join(root, '_site'), join(base, 'link', 'repo', '_site'), join(base, 'elsewhere', 'site'), join(base, '..dots', 'site')]) {
    assert.equal(unsafeOut(out, root), false, out);
  }
});
