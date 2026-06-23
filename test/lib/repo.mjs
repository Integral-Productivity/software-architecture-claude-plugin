// Filesystem discovery for the plugin's authored assets.
//
// Enumerated explicitly rather than via fs.globSync — that API is still
// experimental and absent on Node 20, the repo's CI runtime. The plugin's
// layout is fixed and small, so a direct readdir is clearer and stable.

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to the repository root (two levels up from test/lib/). */
export const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** `skills/<name>/SKILL.md` files that actually exist. */
export function skillFiles() {
  const dir = join(ROOT, 'skills');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name, 'SKILL.md'))
    .filter((p) => existsSync(p));
}

/** Top-level `*.md` files in a sibling directory (commands/, agents/). */
export function markdownFiles(subdir) {
  const dir = join(ROOT, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(dir, name));
}

/** `hooks/*.sh` scripts. */
export function hookFiles() {
  const dir = join(ROOT, 'hooks');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sh'))
    .map((name) => join(dir, name));
}
