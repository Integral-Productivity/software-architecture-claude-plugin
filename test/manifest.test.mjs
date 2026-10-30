// Plugin manifests are valid JSON and internally consistent.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync, constants } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/repo.mjs';

function readJson(relPath) {
  const abs = join(ROOT, relPath);
  assert.ok(existsSync(abs), `${relPath} should exist`);
  const text = readFileSync(abs, 'utf8');
  try {
    return JSON.parse(text);
  } catch (err) {
    assert.fail(`${relPath} is not valid JSON: ${err.message}`);
  }
}

test('.claude-plugin/plugin.json is valid JSON with required fields', () => {
  const manifest = readJson('.claude-plugin/plugin.json');
  for (const key of ['name', 'description', 'version']) {
    assert.ok(
      typeof manifest[key] === 'string' && manifest[key].length > 0,
      `plugin.json '${key}' must be a non-empty string`,
    );
  }
});

test('hooks are registered where Claude Code loads them', () => {
  // Claude Code reads hooks/hooks.json unless plugin.json names a "hooks" path. A manifest at
  // .claude-plugin/hooks.json is never loaded, so no hook fires (all hooks were silent until 0.1.1).
  const plugin = readJson('.claude-plugin/plugin.json');
  assert.equal(plugin.hooks, undefined, 'plugin.json must not redirect hooks; keep them in hooks/hooks.json');
  assert.ok(existsSync(join(ROOT, 'hooks/hooks.json')), 'hooks/hooks.json must exist');
  assert.ok(!existsSync(join(ROOT, '.claude-plugin/hooks.json')), '.claude-plugin/hooks.json is never loaded');
});

test('hooks/hooks.json is valid JSON and every command points at an executable script', () => {
  const manifest = readJson('hooks/hooks.json');
  assert.ok(manifest.hooks && typeof manifest.hooks === 'object', "hooks.json must have a 'hooks' object");

  // Collect every command string across all event types / matchers.
  const commands = [];
  for (const entries of Object.values(manifest.hooks)) {
    for (const entry of entries) {
      for (const hook of entry.hooks ?? []) {
        if (hook.command) commands.push(hook.command);
      }
    }
  }
  assert.ok(commands.length > 0, 'expected at least one hook command');

  for (const command of commands) {
    // Manifests reference scripts via ${CLAUDE_PLUGIN_ROOT}; resolve to the repo.
    const resolved = command.replace('${CLAUDE_PLUGIN_ROOT}', ROOT);
    assert.ok(existsSync(resolved), `hooks.json references missing script: ${command}`);
    const mode = statSync(resolved).mode;
    assert.ok(
      (mode & constants.S_IXUSR) !== 0,
      `hook script referenced by manifest is not executable: ${command}`,
    );
  }
});
