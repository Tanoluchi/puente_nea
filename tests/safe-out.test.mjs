import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unsafeOut } from '../scripts/safe-out.mjs';

// Pure check, no deletion: the build wipes its output folder, so it must never be the repo or contain it.
const base = mkdtempSync(join(tmpdir(), 'safe-out-'));
const root = join(base, 'real', 'repo');
mkdirSync(root, { recursive: true });
symlinkSync(join(base, 'real'), join(base, 'link')); // like macOS /var -> /private/var
test.after(() => rmSync(base, { recursive: true, force: true }));

test('the repository, its parents and the filesystem root are refused, also through a symlink', () => {
  for (const out of [root, join(base, 'real'), base, '/', join(base, 'link'), join(base, 'link', 'repo')]) {
    assert.equal(unsafeOut(out, root), true, out);
  }
});

test('a folder inside the repository or elsewhere is allowed, even if it does not exist yet', () => {
  for (const out of [join(root, '_site'), join(base, 'link', 'repo', '_site'), join(base, 'elsewhere', 'site')]) {
    assert.equal(unsafeOut(out, root), false, out);
  }
});
