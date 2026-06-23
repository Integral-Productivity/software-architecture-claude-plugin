// Hook scripts are executable, syntactically valid, and emit valid JSON.
//
// Every hook in this plugin follows the same contract: read the hook
// payload on stdin, and EITHER stay silent (exit 0, no output) OR print a
// single Claude Code hook-output JSON object. So the universal assertion
// is: exit 0, and any stdout that is produced parses as JSON.
//
// `bash -n` (syntax-only parse) runs everywhere. The JSON-emission checks
// shell out to the hook, which needs `jq` — the hooks' own runtime
// dependency. When jq is absent we skip those (CI has jq), keeping the
// syntax + executable coverage unconditional.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, constants } from 'node:fs';
import { basename, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, hookFiles } from './lib/repo.mjs';

const rel = (p) => relative(ROOT, p);
const HOOKS = hookFiles();
const HAS_JQ = spawnSync('jq', ['--version']).status === 0;

function runHook(file, stdin, env = {}) {
  return spawnSync('bash', [file], {
    input: stdin,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    cwd: ROOT,
  });
}

test('there is at least one hook to validate', () => {
  assert.ok(HOOKS.length > 0, 'expected hooks/*.sh files');
});

for (const hook of HOOKS) {
  const name = basename(hook);

  test(`${name} is executable`, () => {
    const mode = statSync(hook).mode;
    assert.ok((mode & constants.S_IXUSR) !== 0, `${rel(hook)} is missing the user execute bit`);
  });

  test(`${name} parses cleanly under bash -n`, () => {
    const result = spawnSync('bash', ['-n', hook], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${rel(hook)} has a syntax error:\n${result.stderr}`);
  });

  test(`${name} exits 0 and emits only valid JSON on a minimal payload`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    const result = runHook(hook, '{}\n');
    assert.equal(result.status, 0, `${rel(hook)} exited ${result.status}:\n${result.stderr}`);
    const out = result.stdout.trim();
    if (out.length > 0) {
      assert.doesNotThrow(
        () => JSON.parse(out),
        `${rel(hook)} produced non-JSON output:\n${out}`,
      );
    }
  });
}

test('prompt-submit.sh emits valid hook JSON for an architectural-decision prompt', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const hook = HOOKS.find((h) => basename(h) === 'prompt-submit.sh');
  assert.ok(hook, 'prompt-submit.sh should exist');

  const payload = JSON.stringify({ prompt: "we should migrate this monolith to microservices" });
  const result = runHook(hook, payload);
  assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);

  const out = result.stdout.trim();
  assert.ok(out.length > 0, 'expected JSON output for a decision-language prompt');
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput?.hookEventName, 'UserPromptSubmit');
  assert.ok(
    typeof parsed.hookSpecificOutput?.additionalContext === 'string'
      && parsed.hookSpecificOutput.additionalContext.length > 0,
    'expected a non-empty additionalContext reminder',
  );
});
