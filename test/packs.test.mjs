// Compound Packs under packs/ follow the compound-engineering 3.33.1 format.
//
// Discovery reads only top-level `.md` files with `title` and `applies_when`
// (README.md is the pack's description). A rule missing either field is
// skipped by the resolver with a warning nobody sees in CI, so this test
// makes it fail here instead. It also keeps the packs portable: no pack or
// hook file may name the organization that maintains this repository.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseFrontmatter, missingFields } from './lib/frontmatter.mjs';
import { ROOT } from './lib/repo.mjs';

const PACKS = join(ROOT, 'packs');
const rel = (p) => relative(ROOT, p);

function packDirs() {
  if (!existsSync(PACKS)) return [];
  return readdirSync(PACKS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(PACKS, e.name));
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    return e.isDirectory() ? walk(path) : [path];
  });
}

test('there is at least one pack with a README and a rule', () => {
  const dirs = packDirs();
  assert.ok(dirs.length > 0, 'expected packs/<id>/ directories');
  for (const dir of dirs) {
    assert.ok(existsSync(join(dir, 'README.md')), `${rel(dir)} needs a README.md`);
  }
});

for (const dir of packDirs()) {
  const rules = readdirSync(dir).filter((name) => name.endsWith('.md') && name.toLowerCase() !== 'readme.md');

  test(`${rel(dir)} has at least one rule`, () => {
    assert.ok(rules.length > 0, `${rel(dir)} has no top-level rule files`);
  });

  for (const name of rules) {
    test(`${rel(dir)}/${name} has title and a non-empty applies_when list`, () => {
      const parsed = parseFrontmatter(readFileSync(join(dir, name), 'utf8'));
      assert.ok(parsed.ok, `${name}: ${parsed.reason}`);
      assert.deepEqual(missingFields(parsed.values, ['title', 'applies_when']), []);
      const items = parsed.values.get('applies_when').split('\n');
      assert.ok(items.every((item) => /^- \S/.test(item)), `${name}: applies_when must be a YAML list`);
    });
  }

  test(`${rel(dir)} keeps no rule-shaped files in subdirectories`, () => {
    const nested = readdirSync(dir)
      .map((name) => join(dir, name))
      .filter((path) => statSync(path).isDirectory())
      .flatMap(walk)
      .filter((path) => path.endsWith('.md'))
      .filter((path) => parseFrontmatter(readFileSync(path, 'utf8')).values.has('applies_when'));
    assert.deepEqual(nested.map(rel), [], 'discovery never reads rules in subdirectories');
  });
}

// The owner comes from this checkout's own git config at runtime, so the name
// is never written into this file. Skipped when there is no origin remote.
function originOwner() {
  const config = join(ROOT, '.git', 'config');
  if (!existsSync(config) || !statSync(config).isFile()) return null;
  const match = /\[remote "origin"\][^[]*?url\s*=\s*(\S+)/.exec(readFileSync(config, 'utf8'));
  if (!match) return null;
  const parts = match[1].replace(/\.git$/, '').split(/[/:]/).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

test('pack and hook files name no organization', (t) => {
  const owner = originOwner();
  if (!owner) return t.skip('no origin remote to read the owner from');
  const needles = [owner.toLowerCase(), owner.toLowerCase().replace(/[-_]/g, ' ')];
  const files = [PACKS, join(ROOT, 'hooks')].filter(existsSync).flatMap(walk);
  for (const file of files) {
    const text = readFileSync(file, 'utf8').toLowerCase();
    for (const needle of needles) {
      assert.ok(!text.includes(needle), `${rel(file)} names the maintaining organization`);
    }
  }
});
