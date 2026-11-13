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
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync, constants } from 'node:fs';
import { tmpdir } from 'node:os';
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
// `test/fixtures/radar.md` plants traps in Notes-column prose: the Adopt
// `node:test` row says "do not introduce Jest", and the Adopt `esbuild` row
// says "Prefer over webpack". Neither may resolve a ring. Its trailing
// `## Retired` section pins the other half: a non-ring heading clears the
// current ring instead of leaking Hold onto the rows below.

const RADAR = join(ROOT, 'test', 'fixtures', 'radar.md');
const DEPS_HOOK = HOOKS.find((h) => basename(h) === 'deps-pretooluse.sh');

/** A PreToolUse payload for an Edit that adds `body` to a dependency file. */
function depsEdit(body, filePath = '/tmp/package.json') {
  return JSON.stringify({
    tool_name: 'Edit',
    tool_input: { file_path: filePath, new_string: body },
  });
}

/** Run the deps hook against the fixture radar and return additionalContext. */
function ringContext(t, body, filePath) {
  assert.ok(DEPS_HOOK, 'deps-pretooluse.sh should exist');
  const result = runHook(DEPS_HOOK, depsEdit(body, filePath), {
    SA_RADAR_PATH: RADAR,
    SA_PLUGIN_HOOKS: 'deps',
  });
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

test('deps-pretooluse.sh stays quiet about an Assess-ring dependency', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // Assess shares the silent branch with Adopt, so it needs its own case.
  const context = ringContext(t, '{"devDependencies":{"deno":"^2.0.0"}}');

  assert.doesNotMatch(context, /deno/i);
});

test('deps-pretooluse.sh resolves a name inside a compound Technology cell', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // The Hold cell is `` `Bower` + `Grunt` ``, the backticked style the real
  // radar uses. Resolving `bower` proves the lookup normalizes punctuation and
  // compares whole tokens, rather than matching the cell text as-is.
  const context = ringContext(t, '{"devDependencies":{"bower":"^1.8.0"}}');

  assert.match(context, /Hold-ring dependencies detected/);
  assert.match(context, /\bbower\b/);
});

test('deps-pretooluse.sh does not leak a ring into a following non-ring section', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // `Gulp` sits under `## Retired`, immediately after `## Hold`. Without the
  // section reset it would inherit Hold and be reported as a banned dependency.
  const context = ringContext(t, '{"devDependencies":{"gulp":"^5.0.0"}}');

  assert.doesNotMatch(context, /Hold-ring dependencies detected/);
  assert.match(context, /not on the Radar/);
  assert.match(context, /\bgulp\b/);
});

test('deps-pretooluse.sh still reports Hold on a radar larger than the pipe buffer', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // The lookup exits at the first match. Feeding the radar through a pipe made
  // that exit kill the writer with SIGPIPE once the file outgrew the pipe
  // buffer, and `pipefail` turned that into exit 141 with no output at all --
  // the warning vanishing on exactly the biggest radars.
  const dir = mkdtempSync(join(tmpdir(), 'sa-radar-'));
  const bigRadar = join(dir, 'radar.md');
  try {
    const filler = Array.from(
      { length: 8000 },
      (_, i) => `| filler-pkg-${i} | Build | Padding row to grow the radar past the pipe buffer |`,
    ).join('\n');
    writeFileSync(
      bigRadar,
      `# Big radar\n\n## Hold\n\n| Technology | Category | Notes |\n|---|---|---|\n| Jest | Testing | Use \`node:test\` instead |\n${filler}\n`,
    );
    assert.ok(statSync(bigRadar).size > 512 * 1024, 'fixture radar should exceed any pipe buffer');

    const result = runHook(DEPS_HOOK, depsEdit('{"devDependencies":{"jest":"^29.0.0"}}'), {
      SA_RADAR_PATH: bigRadar,
      SA_PLUGIN_HOOKS: 'deps',
    });

    assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
    const out = result.stdout.trim();
    assert.ok(out.length > 0, 'expected a Hold warning, not silence');
    assert.match(
      JSON.parse(out).hookSpecificOutput?.additionalContext ?? '',
      /Hold-ring dependencies detected/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- deps-pretooluse.sh candidate extraction ---------------------------------
//
// The extractor greps quoted lowercase tokens, which matches the object key
// `"dependencies"` as readily as the package names nested inside it. A
// manifest structural key is not a technology and must not reach the radar
// lookup or the message.

test('deps-pretooluse.sh does not report a manifest structural key as a technology', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const context = ringContext(t, '{"dependencies":{"lodash":"^4.17.21"}}');

  assert.doesNotMatch(context, /\bdependencies\b(?![ -])/);
  assert.match(context, /\blodash\b/);
});

test('deps-pretooluse.sh drops structural keys from a pretty-printed manifest', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // Real manifests put whitespace and a newline between the key and its brace.
  const context = ringContext(t, '{\n  "dependencies": {\n    "lodash": "^4.17.21"\n  }\n}');

  assert.doesNotMatch(context, /\bdependencies\b(?![ -])/);
  assert.match(context, /\blodash\b/);
});

test('deps-pretooluse.sh still finds a Hold dependency beside a structural key', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // Filtering containers must not filter their contents.
  const context = ringContext(t, '{"dependencies":{"jest":"^29.0.0"}}');

  assert.match(context, /Hold-ring dependencies detected/);
  assert.match(context, /\bjest\b/);
});

test('deps-pretooluse.sh still extracts a quoted dependency from a non-JSON manifest', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // A Gemfile has no `key: {` shape at all, so nothing may be filtered out.
  const context = ringContext(t, 'gem "rails", "~> 7.1"', '/tmp/Gemfile');

  assert.match(context, /\brails\b/);
});

test('deps-pretooluse.sh exits 0 when a dependency file yields no candidates', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // grep exits 1 when it matches nothing, which `set -o pipefail` would turn
  // into a failing hook instead of the contracted silent exit 0.
  const result = runHook(DEPS_HOOK, depsEdit('NAME = "MyApp"', '/tmp/Cargo.toml'), {
    SA_RADAR_PATH: RADAR,
    SA_PLUGIN_HOOKS: 'deps',
  });

  assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
  assert.equal(result.stdout.trim(), '', 'expected silence, not a warning');
});

test('deps-pretooluse.sh filters whole container keys, not substrings of names', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  // `dependencies-tree` merely contains the container key. Filtering by
  // substring would drop a real package from the radar lookup entirely --
  // the silent under-enforcement this hook exists to prevent.
  const context = ringContext(t, '{"dependencies":{"dependencies-tree":"^1.0.0"}}');

  assert.match(context, /\bdependencies-tree\b/);
});

// --- placement-pretooluse.sh -------------------------------------------------
//
// The placement hook reminds the agent to run the placement fit check when a
// Write creates a NEW capability file (SAE-027). It only adds context; it
// never denies. Paths are data: the hook passes them only to `[[ -e ]]` and
// `jq --arg`, so a hostile path segment must never execute.

const PLACEMENT_HOOK = HOOKS.find((h) => basename(h) === 'placement-pretooluse.sh');

/** A PreToolUse payload for a Write (or other tool) to `filePath`. */
function placementPayload(filePath, { tool = 'Write', cwd } = {}) {
  const payload = { tool_name: tool, tool_input: { file_path: filePath, content: 'x' } };
  if (cwd) payload.cwd = cwd;
  return JSON.stringify(payload);
}

/** Run the placement hook and return its additionalContext ('' when silent). */
function placementContext(filePath, opts = {}, env = { SA_PLUGIN_HOOKS: 'placement' }) {
  assert.ok(PLACEMENT_HOOK, 'placement-pretooluse.sh should exist');
  const result = runHook(PLACEMENT_HOOK, placementPayload(filePath, opts), env);
  assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
  const out = result.stdout.trim();
  if (out.length === 0) return '';
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput?.hookEventName, 'PreToolUse');
  assert.equal(parsed.hookSpecificOutput?.permissionDecision, undefined, 'the hook must never decide');
  return parsed.hookSpecificOutput?.additionalContext ?? '';
}

/** A temporary plugin root: a directory holding `.claude-plugin/plugin.json`. */
function withPluginRoot(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'sa-placement-'));
  try {
    mkdirSync(join(dir, '.claude-plugin'));
    writeFileSync(join(dir, '.claude-plugin', 'plugin.json'), '{"name":"tmp"}\n');
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const relPath of ['skills/foo/SKILL.md', 'commands/foo.md', 'agents/foo.md', 'hooks/foo.sh']) {
  test(`placement-pretooluse.sh reminds on a new ${relPath} in a plugin root`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    withPluginRoot((dir) => {
      const context = placementContext(join(dir, relPath));
      assert.match(context, /software-architecture:conceptual-integrity/);
      assert.match(context, /Placement fit:/);
      assert.match(context, /remove/i);
    });
  });
}

test('placement-pretooluse.sh reminds on a new command under a .claude directory', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const dir = mkdtempSync(join(tmpdir(), 'sa-placement-'));
  try {
    mkdirSync(join(dir, '.claude'));
    assert.match(placementContext(join(dir, '.claude', 'commands', 'foo.md')), /conceptual-integrity/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('placement-pretooluse.sh leaves a new ADR to adr-pretooluse.sh (ADR-0006)', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const dir = mkdtempSync(join(tmpdir(), 'sa-placement-'));
  try {
    assert.equal(placementContext(join(dir, 'docs/adr/0009-x.md')), '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const relPath of ['.claude-plugin/plugin.json']) {
  test(`placement-pretooluse.sh reminds on a new ${relPath} anywhere`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    const dir = mkdtempSync(join(tmpdir(), 'sa-placement-'));
    try {
      assert.match(placementContext(join(dir, relPath)), /conceptual-integrity/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('placement-pretooluse.sh stays silent for an existing capability file', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withPluginRoot((dir) => {
    mkdirSync(join(dir, 'commands'));
    writeFileSync(join(dir, 'commands', 'foo.md'), '# foo\n');
    assert.equal(placementContext(join(dir, 'commands', 'foo.md')), '');
  });
});

for (const relPath of ['src/index.ts', 'commands/sub/foo.md']) {
  test(`placement-pretooluse.sh stays silent for non-capability path ${relPath}`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    withPluginRoot((dir) => {
      assert.equal(placementContext(join(dir, relPath)), '');
    });
  });
}

for (const relPath of ['src/hooks/useAuth.ts', 'docs/commands/foo.md']) {
  test(`placement-pretooluse.sh stays silent for ${relPath} outside a plugin root`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    const dir = mkdtempSync(join(tmpdir(), 'sa-placement-'));
    try {
      assert.equal(placementContext(join(dir, relPath)), '');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('placement-pretooluse.sh stays silent for an Edit', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withPluginRoot((dir) => {
    assert.equal(placementContext(join(dir, 'commands', 'foo.md'), { tool: 'Edit' }), '');
  });
});

test('placement-pretooluse.sh honours the SA_PLUGIN_HOOKS opt-out', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withPluginRoot((dir) => {
    const target = join(dir, 'commands', 'foo.md');
    assert.equal(placementContext(target, {}, { SA_PLUGIN_HOOKS: 'deps' }), '');
    assert.match(placementContext(target, {}, { SA_PLUGIN_HOOKS: 'deps,placement' }), /conceptual-integrity/);
  });
});

test('placement-pretooluse.sh resolves a relative path against the payload cwd', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withPluginRoot((dir) => {
    assert.match(placementContext('commands/foo.md', { cwd: dir }), /conceptual-integrity/);
    mkdirSync(join(dir, 'commands'));
    writeFileSync(join(dir, 'commands', 'foo.md'), '# foo\n');
    assert.equal(placementContext('commands/foo.md', { cwd: dir }), '');
  });
});

test('placement-pretooluse.sh never executes a hostile path segment', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withPluginRoot((dir) => {
    const target = join(dir, 'skills', '$(touch pwned-placement)', 'SKILL.md');
    const result = runHook(PLACEMENT_HOOK, placementPayload(target, { cwd: dir }), {
      SA_PLUGIN_HOOKS: 'placement',
    });
    assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
    assert.match(result.stdout, /conceptual-integrity/);
    assert.ok(!existsSync(join(dir, 'pwned-placement')), 'hostile segment ran in the plugin root');
    assert.ok(!existsSync(join(ROOT, 'pwned-placement')), 'hostile segment ran in the repo root');
  });
});

test('placement-pretooluse.sh exits 0 silently when jq is missing', () => {
  assert.ok(PLACEMENT_HOOK, 'placement-pretooluse.sh should exist');
  const result = spawnSync('/bin/bash', [PLACEMENT_HOOK], {
    input: placementPayload('/tmp/x/docs/adr/0001-x.md'),
    encoding: 'utf8',
    env: { PATH: '/nonexistent', SA_PLUGIN_HOOKS: 'placement' },
    cwd: ROOT,
  });
  assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
  assert.equal(result.stdout.trim(), '');
});

// --- adr-pretooluse.sh -------------------------------------------------------
//
// Hook 10 (ADR-0006) puts the ADR practice in front of the agent when an ADR
// file is written or edited, or `adr new` runs, even with no decision phrase in
// the prompt. It only adds context; it never denies. ARCHITECTURE.md content is
// data: a hostile row must never execute.

const ADR_HOOK = HOOKS.find((h) => basename(h) === 'adr-pretooluse.sh');

function adrContext(payload, env = { SA_PLUGIN_HOOKS: 'adr' }) {
  assert.ok(ADR_HOOK, 'adr-pretooluse.sh should exist');
  const result = runHook(ADR_HOOK, JSON.stringify(payload), env);
  assert.equal(result.status, 0, `exited ${result.status}:\n${result.stderr}`);
  const out = result.stdout.trim();
  if (out.length === 0) return '';
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput?.hookEventName, 'PreToolUse');
  assert.equal(parsed.hookSpecificOutput?.permissionDecision, undefined, 'the hook must never decide');
  return parsed.hookSpecificOutput?.additionalContext ?? '';
}

/** A temporary git repository root (a directory holding `.git`). */
function withRepo(fn, { architecture } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sa-adr-'));
  try {
    mkdirSync(join(dir, '.git'));
    mkdirSync(join(dir, 'docs', 'adr'), { recursive: true });
    if (architecture) writeFileSync(join(dir, 'ARCHITECTURE.md'), architecture);
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const write = (file_path, cwd) => ({ tool_name: 'Write', tool_input: { file_path, content: 'x' }, ...(cwd ? { cwd } : {}) });
const edit = (file_path) => ({ tool_name: 'Edit', tool_input: { file_path, old_string: 'a', new_string: 'b' } });
const bash = (command, cwd) => ({ tool_name: 'Bash', tool_input: { command }, cwd });

const CONTEXT_SOURCES = `# Architecture

## Governance Routing

| Decision Level | Lives At | Prefix |
|---|---|---|
| System | docs/adr/ | numeric |

## Context Sources

| Order | Level | Source | ADR path | Prefix | Mode | Revolt channel |
|---|---|---|---|---|---|---|
| 1 | Enterprise | example-org/standards | docs/adr/ | STD- | binding | example-org/standards issues |
| 2 | Platform | example-org/platform | docs/adr/ | PLAT- | binding | example-org/platform issues |
| 3 | System | this repository | docs/adr/ | numeric | binding | — |

## Notes
`;

test('adr-pretooluse.sh gives the scope test and Placement fit line for a new ADR', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    const context = adrContext(write(join(dir, 'docs/adr/0007-use-postgres.md')));
    assert.match(context, /software-architecture:architecture-decision-records/);
    assert.match(context, /Scope test/);
    assert.match(context, /worklog/);
    assert.match(context, /Placement fit:/);
    assert.match(context, /software-architecture:context/, 'no Context Sources: offer the setup command');
  });
});

test('adr-pretooluse.sh lists Context Sources in their configured order', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    const context = adrContext(write(join(dir, 'docs/adr/0007-x.md')));
    const std = context.indexOf('example-org/standards');
    const plat = context.indexOf('example-org/platform');
    assert.ok(std > 0 && plat > std, `expected enterprise before platform:\n${context}`);
    assert.match(context, /Constrained by:/);
    assert.match(context, /Deviates from:/);
    assert.match(context, /revolt via example-org\/standards issues/);
    assert.doesNotMatch(context, /Decision Level/, 'only the Context Sources table is read');
  }, { architecture: CONTEXT_SOURCES });
});

test('adr-pretooluse.sh gives lifecycle rules for an Edit of an ADR', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    const file = join(dir, 'docs/adr/0001-x.md');
    writeFileSync(file, '# 1. X\n');
    const context = adrContext(edit(file));
    assert.match(context, /ADR edit/);
    assert.match(context, /Superseded/);
    assert.match(context, /Do not rewrite the Decision/);
    const overwrite = adrContext(write(file));
    assert.match(overwrite, /ADR edit/, 'a Write over an existing ADR is an edit');
  });
});

test('adr-pretooluse.sh honours a custom .adr-dir', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    writeFileSync(join(dir, '.adr-dir'), 'architecture/decisions\n');
    assert.match(adrContext(write(join(dir, 'architecture/decisions/0002-y.md'))), /Scope test/);
  });
});

test('adr-pretooluse.sh fires on `adr new` and not on other commands', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    assert.match(adrContext(bash('adr new Use event sourcing for orders', dir)), /Scope test/);
    assert.match(adrContext(bash('cd docs && adr new -s 3 Replace X', dir)), /Scope test/);
    assert.equal(adrContext(bash('adr list', dir)), '');
    assert.equal(adrContext(bash('echo "read the adr new section"', dir)), '');
  });
});

for (const relPath of ['src/adr.md', 'docs/notes/0001-x.md', 'docs/adr/README.md', 'docs/adr/0001-x.txt']) {
  test(`adr-pretooluse.sh stays silent for ${relPath}`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    withRepo((dir) => {
      assert.equal(adrContext(write(join(dir, relPath))), '');
    });
  });
}

test('adr-pretooluse.sh honours the SA_PLUGIN_HOOKS opt-out', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    const payload = write(join(dir, 'docs/adr/0007-x.md'));
    assert.equal(adrContext(payload, { SA_PLUGIN_HOOKS: 'placement' }), '');
    assert.match(adrContext(payload, { SA_PLUGIN_HOOKS: 'placement,adr' }), /Scope test/);
  });
});

test('adr-pretooluse.sh never executes ARCHITECTURE.md content or the file path', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const hostile = CONTEXT_SOURCES.replace('example-org/standards issues', '$(touch PWNED_ROW) `touch PWNED_TICK`');
  withRepo((dir) => {
    const context = adrContext(write(join(dir, 'docs/adr/0007-$(touch PWNED_PATH).md'), dir));
    assert.match(context, /Scope test/);
    for (const marker of ['PWNED_ROW', 'PWNED_TICK', 'PWNED_PATH']) {
      assert.ok(!existsSync(join(dir, marker)) && !existsSync(join(ROOT, marker)), `${marker} was executed`);
    }
  }, { architecture: hostile });
});

test('prompt-submit.sh adds the ADR scope and lifecycle reminder for ADR language', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const hook = HOOKS.find((h) => basename(h) === 'prompt-submit.sh');
  const run = (prompt) => {
    const out = runHook(hook, JSON.stringify({ prompt })).stdout.trim();
    return out ? JSON.parse(out).hookSpecificOutput.additionalContext : '';
  };
  assert.match(run('Please supersede ADR-0003 with the new routing'), /adr-audit/);
  assert.match(run('write an ADR for this'), /scope test/);
  assert.equal(run('read the address list and fix the typo'), '');
});

test('adr-pretooluse.sh lists Radar Sources in order for technology-adoption ADRs', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const arch = `${CONTEXT_SOURCES}
## Radar Sources

| Order | Radar | Location | Kind | Mode |
|---|---|---|---|---|
| 1 | Org radar | docs/tech-context/radar.md | file | binding |
| 2 | Thoughtworks | https://www.thoughtworks.com/radar | thoughtworks | advisory |
`;
  withRepo((dir) => {
    const context = adrContext(write(join(dir, 'docs/adr/0008-adopt-x.md')));
    assert.match(context, /software-architecture:adopt/);
    const org = context.indexOf('Org radar');
    const tw = context.indexOf('Thoughtworks: https');
    assert.ok(org > 0 && tw > org, `expected org radar before Thoughtworks:\n${context}`);
    assert.match(context, /file, binding/);
  }, { architecture: arch });
});

test('adr-pretooluse.sh offers radar setup when no radar is configured', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  withRepo((dir) => {
    const context = adrContext(write(join(dir, 'docs/adr/0008-x.md')), { SA_PLUGIN_HOOKS: 'adr', SA_RADAR_PATH: '' });
    assert.match(context, /no radar is configured/);
  });
});
