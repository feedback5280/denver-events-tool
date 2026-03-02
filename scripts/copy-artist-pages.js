/**
 * Copies any folder containing an index.html into dist/
 * Add a new artist folder and it just works — no config needed.
 * Skips: node_modules, dist, src, public, scripts, .git
 */

import { readdirSync, statSync, cpSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const SKIP = new Set(['node_modules', 'dist', 'src', 'public', 'scripts', '.git', '__MACOSX']);

const dirs = readdirSync(ROOT).filter(name => {
  if (SKIP.has(name)) return false;
  if (name.startsWith('.')) return false;
  const full = join(ROOT, name);
  return statSync(full).isDirectory() && existsSync(join(full, 'index.html'));
});

for (const dir of dirs) {
  const src = join(ROOT, dir);
  const dest = join(DIST, dir);
  cpSync(src, dest, { recursive: true });
  console.log(`✓ Copied ${dir}/ → dist/${dir}/`);
}

console.log(`\nDone — ${dirs.length} artist page(s) copied.`);
