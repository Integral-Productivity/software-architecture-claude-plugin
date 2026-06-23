// Frontmatter validity for every skill, command, and agent.
//
// Required fields per CONTRIBUTING.md "Authoring conventions" and the
// Claude Code plugin contract:
//   skills   -> name, description
//   commands -> name, description
//   agents   -> name, description, tools, model

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parseFrontmatter, missingFields } from './lib/frontmatter.mjs';
import { ROOT, skillFiles, markdownFiles } from './lib/repo.mjs';

const rel = (p) => relative(ROOT, p);

function checkAll(files, required) {
  assert.ok(files.length > 0, 'expected at least one file to validate');
  for (const file of files) {
    const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
    assert.ok(parsed.ok, `${rel(file)}: ${parsed.reason ?? 'unparseable frontmatter'}`);
    const problems = missingFields(parsed.values, required);
    assert.equal(
      problems.length,
      0,
      `${rel(file)}: ${problems.join('; ')}`,
    );
  }
}

test('every skill has valid frontmatter (name, description)', () => {
  checkAll(skillFiles(), ['name', 'description']);
});

test('every command has valid frontmatter (name, description)', () => {
  checkAll(markdownFiles('commands'), ['name', 'description']);
});

test('every agent has valid frontmatter (name, description, tools, model)', () => {
  checkAll(markdownFiles('agents'), ['name', 'description', 'tools', 'model']);
});
