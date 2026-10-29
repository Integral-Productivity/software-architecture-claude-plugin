// Governing-document anchors: read tracker, change gate, skill-start reminder.
//
// Each test names the scenario it covers in
// docs/scenarios/governing-document-anchors.feature (ADR-0005).
//
// Every test builds throwaway repositories with a hand-written .git/config
// (the hooks read that file and never spawn git), and points TMPDIR (session
// markers) and XDG_STATE_HOME (evidence log) into its own sandbox so no test
// sees another test's state. The hooks need jq; without it they stay silent
// by contract, so these tests skip.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/repo.mjs';

const HAS_JQ = spawnSync('jq', ['--version']).status === 0;
const SESSION = 'session-1';

const STRATEGY = `# Strategy

## Target problem

Agents change repositories without reading their governing documents.

## Boundaries

- Hooks stay silent when they have nothing to say.
- No state across sessions in hooks.

## Key metrics

- Context before change: share of first changes made with anchors read.

## Tracks

- Governing-document anchors.
`;
const QUALITY = '# Quality\n\n## Factors\n\n- Security\n';
const BOTH = { 'STRATEGY.md': STRATEGY, 'QUALITY.md': QUALITY };

/** A sandbox with its own marker root, log directory and repositories. */
function sandbox(t) {
  const base = mkdtempSync(join(tmpdir(), 'sa-anchors-test-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  mkdirSync(join(base, 'tmp'));
  return {
    base,
    env: {
      TMPDIR: join(base, 'tmp'),
      XDG_STATE_HOME: join(base, 'state'),
      SA_ANCHORS_OWNERS: 'acme',
    },
    log: join(base, 'state', 'software-architecture', 'anchors.log'),
    markers: join(base, 'tmp', 'sa-anchors'),
  };
}

/** A repository root with a .git/config naming `url` as origin. */
function makeRepo(base, { name = 'widgets', url = 'git@github.com:Acme/widgets.git', files = BOTH } = {}) {
  const root = join(base, name);
  mkdirSync(join(root, '.git'), { recursive: true });
  writeFileSync(
    join(root, '.git', 'config'),
    `[core]\n\trepositoryformatversion = 0\n[remote "upstream"]\n\turl = git@github.com:Other/fork.git\n[remote "origin"]\n\turl = ${url}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`,
  );
  for (const [file, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), body);
  }
  return root;
}

function run(hook, payload, env) {
  const clean = { ...process.env };
  for (const key of ['SA_ANCHORS_OWNERS', 'SA_ANCHORS_LOG', 'SA_PLUGIN_HOOKS']) delete clean[key];
  const merged = { ...clean, ...env };
  for (const [key, value] of Object.entries(merged)) if (value === undefined) delete merged[key];
  return spawnSync('bash', [join(ROOT, 'hooks', hook)], {
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
    encoding: 'utf8',
    env: merged,
    cwd: ROOT,
  });
}

/** Run a hook and return its parsed output ({} when silent). */
function output(hook, payload, env) {
  const result = run(hook, payload, env);
  assert.equal(result.status, 0, `${hook} exited ${result.status}:\n${result.stderr}`);
  const out = result.stdout.trim();
  assert.doesNotMatch(out, /permissionDecision/);
  return out.length === 0 ? {} : JSON.parse(out);
}

const context = (hook, payload, env) => output(hook, payload, env).hookSpecificOutput?.additionalContext ?? '';
const logLines = (path) => (existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean) : []);

const read = (cwd, filePath, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'PostToolUse', tool_name: 'Read', tool_input: { file_path: filePath },
});
const bashRead = (cwd, command, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command },
});
const edit = (cwd, filePath, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'PreToolUse', tool_name: 'Edit',
  tool_input: { file_path: filePath, old_string: 'a', new_string: 'b' },
});
const write = (cwd, filePath, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'PreToolUse', tool_name: 'Write',
  tool_input: { file_path: filePath, content: 'x' },
});
const bash = (cwd, command, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command },
});
const skill = (cwd, name, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'PreToolUse', tool_name: 'Skill', tool_input: { skill: name },
});
const prompt = (cwd, text, session = SESSION) => ({
  session_id: session, cwd, hook_event_name: 'UserPromptSubmit', prompt: text,
});

const readBoth = (root, env) => {
  output('anchors-read.sh', read(root, join(root, 'STRATEGY.md')), env);
  output('anchors-read.sh', read(root, join(root, 'QUALITY.md')), env);
};

// --- Gate ------------------------------------------------------------------

test('gate: an unread repository gets a warning before its first change', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  const out = output('anchors-gate.sh', edit(root, join(root, 'src', 'a.ts')), s.env);

  assert.equal(out.hookSpecificOutput?.hookEventName, 'PreToolUse');
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.match(ctx, /Unread: STRATEGY\.md, QUALITY\.md/);
  assert.doesNotMatch(ctx, /ARCHITECTURE\.md/);
  const lines = logLines(s.log);
  assert.equal(lines.length, 1);
  assert.deepEqual(lines[0].split('\t').slice(1), ['warn', 'Acme/widgets', 'Edit', '-', 'STRATEGY.md,QUALITY.md']);
});

test('gate: silent when no owner list is configured', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), { ...s.env, SA_ANCHORS_OWNERS: undefined }), '');
  assert.equal(logLines(s.log).length, 0);
});

test('gate: a repository whose anchors were read passes silently and logs pass', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  readBoth(root, s.env);

  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), '');
  const lines = logLines(s.log);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].split('\t')[1], 'pass');
});

test('gate: warns once per repository per session', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.notEqual(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), '');
  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'b.ts')), s.env), '');
  assert.equal(logLines(s.log).length, 1);
});

test('gate: a missing anchor is named with the skill that creates it', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base, { files: { 'STRATEGY.md': STRATEGY } });

  const ctx = context('anchors-gate.sh', write(root, join(root, 'new.md')), s.env);
  assert.match(ctx, /Missing: QUALITY\.md/);
  assert.match(ctx, /qualitymd `quality` skill/);
  assert.match(ctx, /Unread: STRATEGY\.md/);
});

test('gate: a missing STRATEGY.md names ce-strategy', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base, { files: { 'QUALITY.md': QUALITY } });

  const ctx = context('anchors-gate.sh', write(root, join(root, 'x.md')), s.env);
  assert.match(ctx, /Missing: STRATEGY\.md/);
  assert.match(ctx, /ce-strategy/);
});

test('gate: ARCHITECTURE.md counts only when it exists', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base, { files: { ...BOTH, 'ARCHITECTURE.md': '# Architecture\n' } });
  readBoth(root, s.env);

  const ctx = context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env);
  assert.match(ctx, /Unread: ARCHITECTURE\.md/);
  assert.doesNotMatch(ctx, /STRATEGY\.md,|QUALITY\.md,/);
});

test('gate: a shell command that writes files counts as a change', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.equal(context('anchors-gate.sh', bash(root, 'ls -la'), s.env), '');
  assert.equal(context('anchors-gate.sh', bash(root, 'git status 2>&1 > /dev/null'), s.env), '');
  assert.match(context('anchors-gate.sh', bash(root, 'git commit -m x'), s.env), /Unread/);
});

test('gate: detects each shell write pattern', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const commands = [
    'git apply fix.patch', "sed -i 's/a/b/' f.txt", "perl -pi -e 's/a/b/' f.txt", 'echo x | tee f.txt',
    'mv a b', 'cp a b', 'rm a', 'touch a', 'echo x > f.txt', 'echo x >> f.txt', 'cd src && git commit -m y',
  ];
  for (const command of commands) {
    const s = sandbox(t);
    const root = makeRepo(s.base);
    assert.match(context('anchors-gate.sh', bash(root, command), s.env), /Unread/, command);
  }
  for (const command of ['cat a', "sed -n '1,5p' f", 'git log --oneline', 'npm test 2>/dev/null', 'grep -r x .']) {
    const s = sandbox(t);
    const root = makeRepo(s.base);
    assert.equal(context('anchors-gate.sh', bash(root, command), s.env), '', command);
  }
});

test('gate: owner match is case-insensitive and accepts a list or *', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const cases = [
    ['git@github.com:Acme/widgets.git', 'ACME'],
    ['https://github.com/Acme/widgets.git', 'other, acme'],
    ['http://proxy@127.0.0.1:1234/git/Acme/widgets', 'acme'],
    ['git@example.org:Someone/thing.git', '*'],
  ];
  for (const [url, owners] of cases) {
    const s = sandbox(t);
    const root = makeRepo(s.base, { url });
    assert.match(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), { ...s.env, SA_ANCHORS_OWNERS: owners }), /Unread/, `${url} / ${owners}`);
  }
  const s = sandbox(t);
  const root = makeRepo(s.base, { url: 'git@github.com:Someone/widgets.git' });
  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), '');
});

test('gate: an opted-out repository gets no warning', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base, { files: { ...BOTH, '.anchors-opt-out': '' } });

  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), '');
});

test('gate: a file outside any git repository gets no warning', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  mkdirSync(join(s.base, 'loose'));

  assert.equal(context('anchors-gate.sh', edit(join(s.base, 'loose'), join(s.base, 'loose', 'a.ts')), s.env), '');
});

test('gate: reads do not cross sessions', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  readBoth(root, s.env);

  assert.match(context('anchors-gate.sh', edit(root, join(root, 'a.ts'), 'session-2'), s.env), /Unread: STRATEGY\.md, QUALITY\.md/);
});

test('gate: a worktree shares the reads of its main checkout', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const main = makeRepo(s.base);
  const wtGit = join(main, '.git', 'worktrees', 'wt');
  mkdirSync(wtGit, { recursive: true });
  writeFileSync(join(wtGit, 'commondir'), '../..\n');
  const wt = join(s.base, 'wt');
  mkdirSync(wt);
  writeFileSync(join(wt, '.git'), `gitdir: ${wtGit}\n`);
  writeFileSync(join(wt, 'STRATEGY.md'), STRATEGY);
  writeFileSync(join(wt, 'QUALITY.md'), QUALITY);
  readBoth(main, s.env);

  assert.equal(context('anchors-gate.sh', edit(wt, join(wt, 'a.ts')), s.env), '');
  assert.equal(logLines(s.log)[0].split('\t')[1], 'pass');
});

test('gate: NotebookEdit uses notebook_path', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  const payload = {
    session_id: SESSION, cwd: s.base, hook_event_name: 'PreToolUse', tool_name: 'NotebookEdit',
    tool_input: { notebook_path: join(root, 'n.ipynb'), new_source: 'x' },
  };
  assert.match(context('anchors-gate.sh', payload, s.env), /Unread/);
});

test('gate: malformed input and a missing session id exit 0 silently', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.equal(context('anchors-gate.sh', 'not json {', s.env), '');
  assert.equal(context('anchors-gate.sh', { ...edit(root, join(root, 'a.ts')), session_id: undefined }, s.env), '');
});

test('gate: SA_ANCHORS_LOG sets the log path, and off disables it', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  const custom = join(s.base, 'custom', 'gate.log');

  context('anchors-gate.sh', edit(root, join(root, 'a.ts')), { ...s.env, SA_ANCHORS_LOG: custom });
  assert.equal(logLines(custom).length, 1);
  assert.equal(logLines(s.log).length, 0);

  const s2 = sandbox(t);
  const root2 = makeRepo(s2.base);
  assert.match(context('anchors-gate.sh', edit(root2, join(root2, 'a.ts')), { ...s2.env, SA_ANCHORS_LOG: 'off' }), /Unread/);
  assert.equal(logLines(s2.log).length, 0);
});

test('gate: SA_PLUGIN_HOOKS without "anchors" disables it', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), { ...s.env, SA_PLUGIN_HOOKS: 'deps' }), '');
  assert.match(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), { ...s.env, SA_PLUGIN_HOOKS: 'deps,anchors' }), /Unread/);
});

// --- Read tracker ----------------------------------------------------------

test('read: a plain shell read counts as a read', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  mkdirSync(join(root, 'src'));
  output('anchors-read.sh', bashRead(root, 'cat STRATEGY.md'), s.env);
  output('anchors-read.sh', bashRead(join(root, 'src'), 'head -n 40 ../QUALITY.md'), s.env);

  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), '');
});

test('read: a shell read with a /dev/null redirect counts as a read', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  output('anchors-read.sh', bashRead(root, 'cat STRATEGY.md 2>/dev/null'), s.env);

  const markers = readdirSync(s.markers, { recursive: true }).map(String);
  assert.ok(markers.some((p) => p.endsWith('read-STRATEGY.md')), markers.join(', '));
});

test('read: a shell read after cd counts as a read', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  output('anchors-read.sh', bashRead(s.base, `cd ${root} && cat STRATEGY.md QUALITY.md`), s.env);

  assert.equal(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), '');
});

test('read: a read of a file with the same name elsewhere does not count', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base, { files: { ...BOTH, 'docs/STRATEGY.md': STRATEGY } });
  output('anchors-read.sh', read(root, join(root, 'docs', 'STRATEGY.md')), s.env);
  output('anchors-read.sh', bashRead(root, 'cat docs/STRATEGY.md'), s.env);
  output('anchors-read.sh', bashRead(root, 'cat STRATEGY.md > copy.md'), s.env);
  output('anchors-read.sh', read(root, join(root, 'QUALITY.md')), s.env);

  assert.match(context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env), /Unread: STRATEGY\.md$/m);
});

test('read: a read after a warning appends one read-after-warn line', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  context('anchors-gate.sh', edit(root, join(root, 'a.ts')), s.env);
  output('anchors-read.sh', read(root, join(root, 'STRATEGY.md')), s.env);
  output('anchors-read.sh', read(root, join(root, 'STRATEGY.md')), s.env);

  const events = logLines(s.log).map((line) => line.split('\t')[1]);
  assert.deepEqual(events, ['warn', 'read-after-warn']);
});

test('read: a session id is sanitized and stays inside the marker root', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  output('anchors-read.sh', read(root, join(root, 'STRATEGY.md'), '../../evil'), s.env);

  assert.deepEqual(readdirSync(s.markers), ['evil']);
  assert.equal(existsSync(join(s.base, 'evil')), false);
});

test('read: silent and inert on {} and when disabled', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.equal(context('anchors-read.sh', {}, s.env), '');
  assert.equal(context('anchors-read.sh', read(root, join(root, 'STRATEGY.md')), { ...s.env, SA_PLUGIN_HOOKS: 'deps' }), '');
  assert.equal(existsSync(s.markers), false);
});

// --- Reminder --------------------------------------------------------------

for (const name of ['compound-engineering:ce-work', 'compound-engineering:ce-debug', 'compound-engineering:ce-code-review', 'compound-engineering:lfg', 'ce-work']) {
  test(`reminder: fires before ${name}`, (t) => {
    if (!HAS_JQ) return t.skip('jq not installed');
    const s = sandbox(t);
    const root = makeRepo(s.base);

    const out = output('anchors-reminder.sh', skill(root, name), { ...s.env, SA_ANCHORS_OWNERS: undefined });
    assert.equal(out.hookSpecificOutput?.hookEventName, 'PreToolUse');
    const ctx = out.hookSpecificOutput.additionalContext;
    assert.match(ctx, /No state across sessions in hooks\./);
    assert.match(ctx, /Context before change/);
    assert.match(ctx, /QUALITY\.md/);
    assert.doesNotMatch(ctx, /Tracks/);
    const lines = logLines(s.log);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].split('\t')[1], 'remind');
  });
}

test('reminder: fires for a typed slash command', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  const out = output('anchors-reminder.sh', prompt(root, '/compound-engineering:ce-debug fix the parser'), s.env);
  assert.equal(out.hookSpecificOutput?.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /No state across sessions in hooks\./);
  assert.match(context('anchors-reminder.sh', prompt(root, '/lfg'), s.env), /Boundaries/);
});

test('reminder: ignores prompts that only mention a skill or name another one', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  for (const text of ['please run ce-work after lunch', '/ce-workflow now', '/compound-engineering:ce-ideate x']) {
    assert.equal(context('anchors-reminder.sh', prompt(root, text), s.env), '', text);
  }
});

test('reminder: stays silent for other skills', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base);

  assert.equal(context('anchors-reminder.sh', skill(root, 'compound-engineering:ce-ideate'), s.env), '');
  assert.equal(logLines(s.log).length, 0);
});

test('reminder: says a missing anchor is missing and names the skill', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const root = makeRepo(s.base, { files: { 'STRATEGY.md': STRATEGY } });

  const ctx = context('anchors-reminder.sh', skill(root, 'compound-engineering:ce-work'), s.env);
  assert.match(ctx, /Missing: QUALITY\.md/);
  assert.match(ctx, /qualitymd `quality` skill/);
});

test('reminder: silent without anchors, outside git, and when opted out', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const bare = makeRepo(s.base, { name: 'bare', files: {} });
  const opted = makeRepo(s.base, { name: 'opted', files: { ...BOTH, '.anchors-opt-out': '' } });
  mkdirSync(join(s.base, 'loose'));

  for (const cwd of [bare, opted, join(s.base, 'loose')]) {
    assert.equal(context('anchors-reminder.sh', skill(cwd, 'compound-engineering:ce-work'), s.env), '', cwd);
  }
  const both = makeRepo(s.base);
  assert.equal(context('anchors-reminder.sh', skill(both, 'compound-engineering:ce-work'), { ...s.env, SA_PLUGIN_HOOKS: 'anchors' }), '');
  assert.notEqual(context('anchors-reminder.sh', skill(both, 'compound-engineering:ce-work'), { ...s.env, SA_PLUGIN_HOOKS: 'anchors-reminder' }), '');
});

test('reminder: an unreadable STRATEGY.md never fails the hook', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  if (process.getuid?.() === 0) return t.skip('root reads every file');
  const s = sandbox(t);
  const root = makeRepo(s.base);
  chmodSync(join(root, 'STRATEGY.md'), 0o000);
  t.after(() => chmodSync(join(root, 'STRATEGY.md'), 0o644));

  const result = run('anchors-reminder.sh', skill(root, 'compound-engineering:ce-work'), s.env);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('reminder: cuts a very long Boundaries section near the cap', (t) => {
  if (!HAS_JQ) return t.skip('jq not installed');
  const s = sandbox(t);
  const long = Array.from({ length: 300 }, (_, i) => `- Boundary ${i} with padding text to make the line longer.`).join('\n');
  const root = makeRepo(s.base, { files: { 'STRATEGY.md': `# S\n\n## Boundaries\n\n${long}\n\n## Key metrics\n\n- M\n`, 'QUALITY.md': QUALITY } });

  const ctx = context('anchors-reminder.sh', skill(root, 'compound-engineering:ce-work'), s.env);
  assert.ok(ctx.length < 3500, `context is ${ctx.length} characters`);
  assert.match(ctx, /truncated/);
  assert.match(ctx, /Boundary 0 /);
});
