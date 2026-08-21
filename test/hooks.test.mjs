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
import { basename, join, relative } from 'node:path';
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

// --- deps-pretooluse.sh ring lookup -----------------------------------------
//
// The ring lookup must work on any POSIX awk (mawk on CI, onetrue awk on
// macOS), and it must read the ring from the row's *Technology* cell only.
// `test/fixtures/radar.md` plants two traps in Notes-column prose: the Adopt
// `node:test` row says "do not introduce Jest", and the Adopt `esbuild` row
// says "Prefer over webpack". Neither may resolve a ring.

const RADAR = join(ROOT, 'test', 'fixtures', 'radar.md');
const DEPS_HOOK = HOOKS.find((h) => basename(h) === 'deps-pretooluse.sh');

/** A PreToolUse payload for an Edit that adds `body` to a package.json. */
function depsEdit(body) {
  return JSON.stringify({
    tool_name: 'Edit',
    tool_input: { file_path: '/tmp/package.json', new_string: body },
  });
}

/** Run the deps hook against the fixture radar and return additionalContext. */
function ringContext(t, body) {
  assert.ok(DEPS_HOOK, 'deps-pretooluse.sh should exist');
  const result = runHook(DEPS_HOOK, depsEdit(body), { SA_RADAR_PATH: RADAR });
  assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
  const out = result.stdout.trim();
  if (out.length === 0) return '';
  return JSON.parse(out).hookSpecificOutput?.additionalContext ?? '';
}

test('deps-pretooluse.sh resolves a Hold-ring dependency to Hold', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const context = ringContext(t, '{"devDependencies":{"jest":"^29.0.0"}}');

  assert.match(context, /Hold-ring dependencies detected/);
  assert.match(context, /\bjest\b/);
  // The Adopt row's "do not introduce Jest" prose must not win the lookup,
  // and a resolved Hold must not also be reported as unseen.
  assert.doesNotMatch(context, /not on the Radar/);
});

test('deps-pretooluse.sh resolves a Trial-ring dependency to Trial', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const context = ringContext(t, '{"devDependencies":{"vitest":"^3.0.0"}}');

  assert.match(context, /Trial-ring dependencies/);
  assert.match(context, /\bvitest\b/);
});

test('deps-pretooluse.sh stays quiet about an Adopt-ring dependency', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const context = ringContext(t, '{"devDependencies":{"typescript":"^5.0.0"}}');

  assert.doesNotMatch(context, /typescript/i);
});

test('deps-pretooluse.sh will not resolve a ring from Notes-column prose', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // `webpack` appears only in the Adopt row's Notes ("Prefer over webpack").
  // It is on no ring, so it belongs in the unknown bucket, not in Adopt.
  const context = ringContext(t, '{"devDependencies":{"webpack":"^5.0.0"}}');

  assert.match(context, /not on the Radar/);
  assert.match(context, /\bwebpack\b/);
});
