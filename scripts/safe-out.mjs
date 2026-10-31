import { realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative } from 'node:path';

// Real path of a folder that may not exist yet: resolve the nearest existing parent.
// Symlinks matter: on macOS /var is /private/var, and comparing the two spellings once let a parent through.
const real = path => {
  try { return realpathSync(path); }
  catch { return dirname(path) === path ? path : `${real(dirname(path))}/${basename(path)}`; }
};

// True when wiping `out` would delete the repository: it is the repository or one of its parents.
export function unsafeOut(out, root) {
  const fromOut = relative(real(out), real(root));
  return fromOut === '' || (!fromOut.startsWith('..') && !isAbsolute(fromOut));
}
