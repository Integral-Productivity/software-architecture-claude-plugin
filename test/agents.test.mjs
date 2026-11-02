// Behavior of the git commands that agent instructions tell the agent to run.
//
// architecture-reviewer Check E must see new capability files that are not
// committed yet, because Hook 5 dispatches the reviewer before ExitPlanMode,
// while the plan's files are still in the worktree.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './lib/repo.mjs';

const REVIEWER = join(ROOT, 'agents', 'architecture-reviewer.md');

function checkESection() {
  const text = readFileSync(REVIEWER, 'utf8');
  const start = text.indexOf('**Check E');
  assert.ok(start >= 0, 'architecture-reviewer.md has no Check E');
  const end = text.indexOf('\n### ', start);
  return text.slice(start, end < 0 ? undefined : end);
}

// Backticked `git ...` commands in Check E that list added files.
function listingCommands(section) {
  return [...section.matchAll(/`(git (?:diff|ls-files)[^`]*)`/g)]
    .map((m) => m[1])
    .filter((cmd) => /--diff-filter=A|--others/.test(cmd));
}

// Isolate from the caller's git: a git hook can export GIT_DIR, and user
// config can require signed commits.
const GIT_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
);
Object.assign(GIT_ENV, { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' });

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: GIT_ENV });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

test('architecture-reviewer Check E lists uncommitted and untracked new capabilities', () => {
  const commands = listingCommands(checkESection());
  assert.ok(commands.length > 0, 'Check E names no command that lists added files');

  const repo = mkdtempSync(join(tmpdir(), 'sa-check-e-'));
  try {
    git(repo, 'init', '-q');
    writeFileSync(join(repo, 'notes.md'), '# draft command\n');
    git(repo, 'add', 'notes.md');
    git(repo, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base');
    const base = git(repo, 'rev-parse', 'HEAD').trim();
    mkdirSync(join(repo, '.claude-plugin'));
    writeFileSync(join(repo, '.claude-plugin', 'plugin.json'), '{}\n');
    git(repo, 'add', '.claude-plugin/plugin.json'); // staged, not committed
    mkdirSync(join(repo, 'skills', 'new-skill'), { recursive: true });
    writeFileSync(join(repo, 'skills', 'new-skill', 'SKILL.md'), '---\nname: new-skill\n---\n'); // untracked
    mkdirSync(join(repo, 'commands'));
    git(repo, 'mv', 'notes.md', 'commands/moved.md'); // rename into a capability path

    const listed = commands
      .map((cmd) => {
        const args = cmd.replace(/<base>/g, base).split(/\s+/).slice(1);
        return git(repo, ...args);
      })
      .join('\n');

    assert.match(listed, /\.claude-plugin\/plugin\.json/, 'staged new file not listed');
    assert.match(listed, /skills\/new-skill\/SKILL\.md/, 'untracked new file not listed');
    assert.match(listed, /commands\/moved\.md/, 'file renamed into a capability path not listed');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
