import { realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path';

// Real on-disk path of a folder that may not exist yet: resolve the nearest existing parent.
// .native returns the disk's own spelling, so symlinks (macOS /var -> /private/var) and
// case variants on case-insensitive disks (REPO vs repo) collapse to one path.
const real = path => {
  try { return realpathSync.native(path); }
  catch { return dirname(path) === path ? path : join(real(dirname(path)), basename(path)); }
};

// Compare by segments: a folder named "..foo" is not a parent reference.
const outside = rel => rel.split(sep)[0] === '..' || isAbsolute(rel);

// The build wipes its output folder, so only <repo>/_site or a folder outside the repository is safe.
export function unsafeOut(out, root) {
  const o = real(out), r = real(root);
  const rel = relative(r, o);
  if (rel === '_site') return false;
  return !outside(rel) || !outside(relative(o, r)) || rel === '';
}
