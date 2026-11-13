// Lifecycle-bound ADR fitness function (ADR-0009).
//
// Each test names the scenario it covers in docs/scenarios/adr-fitness.feature.
// Every test writes throwaway ADRs into its own temp directory and runs
// fitness/adr-lifecycle.mjs with a fixed --today, so no test depends on the clock.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/repo.mjs';

const SCRIPT = join(ROOT, 'fitness', 'adr-lifecycle.mjs');
const GOOD_PROVENANCE = 'Provenance: Integral-Productivity/example#12';

function adr({ status, provenance = '', revisit = true, extra = '' }) {
  return [
    '# 1. Example decision',
    '',
    'Date: 2026-05-27',
    '',
    '## Status',
    '',
    status,
    '',
    provenance,
    extra,
    '',
    '## Context',
    '',
    'Why.',
    '',
    '## Decision',
    '',
    'What.',
    '',
    '## Consequences',
    '',
    'So what.',
    revisit ? '\n## Revisit triggers\n\n- When X.\n' : '',
  ].join('\n');
}

function run(files, args = []) {
  const dir = mkdtempSync(join(tmpdir(), 'adr-fitness-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  const res = spawnSync(process.execPath, [SCRIPT, '--adr-dir', dir, '--curing-days', '30', ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: '' },
  });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

test('Scenario: A Proposed ADR reports its findings as info', () => {
  const r = run({ '0001-x.md': adr({ status: 'Proposed 2026-11-01' }) }, ['--today', '2026-12-31']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /^INFO .*0001-x\.md: .*[Pp]rovenance/m);
  assert.doesNotMatch(r.out, /^(WARN|FAIL) /m);
});

test('Scenario: A newly Accepted ADR warns during the curing period', () => {
  const r = run({ '0001-x.md': adr({ status: 'Accepted 2026-11-20' }) }, ['--today', '2026-12-01']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /^WARN .*0001-x\.md: .*[Pp]rovenance/m);
  assert.match(r.out, /19 days? (left|remain)/);
});

test('Scenario: An Accepted ADR fails once the curing period has elapsed', () => {
  const r = run({ '0001-x.md': adr({ status: 'Accepted 2026-10-01' }) }, ['--today', '2026-11-13']);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /^FAIL .*0001-x\.md: .*[Pp]rovenance/m);
});

test('Scenario: Existing ADRs are not failed on the day the rule is adopted', () => {
  const r = run(
    { '0001-x.md': adr({ status: 'Accepted 2026-05-27' }) },
    ['--today', '2026-11-20', '--since', '2026-11-13'],
  );
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /^WARN .*0001-x\.md/m);
});

test('An Accepted status with no date uses the Date line, and reports the missing status date', () => {
  const r = run({ '0001-x.md': adr({ status: 'Accepted', provenance: GOOD_PROVENANCE }) }, ['--today', '2026-11-13']);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /^FAIL .*0001-x\.md: .*status has no date/m);
});

test('Scenario: A finished ADR stays at info', () => {
  const r = run(
    {
      '0001-x.md': adr({ status: 'Superseded 2026-11-01 by [ADR-0002](0002-y.md)' }),
      '0002-y.md': adr({ status: 'Proposed 2026-11-01', provenance: GOOD_PROVENANCE, extra: 'Supersedes [ADR-0001](0001-x.md).' }),
    },
    ['--today', '2026-12-31'],
  );
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /^INFO .*0001-x\.md: .*[Pp]rovenance/m);
});

test('Scenario: A complete Accepted ADR has no findings', () => {
  const r = run({ '0001-x.md': adr({ status: 'Accepted 2026-10-01', provenance: GOOD_PROVENANCE }) }, ['--today', '2026-11-13']);
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /^(INFO|WARN|FAIL) /m);
});

test('Scenario: Provenance must name a tracked work item by ID', () => {
  const r = run(
    { '0001-x.md': adr({ status: 'Accepted 2026-10-01', provenance: 'Provenance: a chat thread with Kraig' }) },
    ['--today', '2026-11-13'],
  );
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /names no GitHub issue, Productboard entity or GlassFrog project/);
});

for (const [label, line] of [
  ['GitHub issue URL', 'Provenance: https://github.com/Integral-Productivity/example/issues/12'],
  ['Productboard URL', 'Provenance: https://integralproductivity.productboard.com/detail/MTpQbUVudGl0eTo2NzE2NDk5NC0yMDQx'],
  ['Productboard entity ID', 'Provenance: Productboard feature MTpQbUVudGl0eTo2NzE2NDk5NC0yMDQxLTQ2NTU='],
  ['GlassFrog project', 'Provenance: GlassFrog project 12345678'],
]) {
  test(`Provenance accepts a ${label}`, () => {
    const r = run({ '0001-x.md': adr({ status: 'Accepted 2026-10-01', provenance: line }) }, ['--today', '2026-11-13']);
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /[Pp]rovenance/);
  });
}

test('Scenario: A Superseded ADR must link to a successor that links back', () => {
  const r = run(
    {
      '0001-x.md': adr({ status: 'Superseded 2026-10-01 by [ADR-0002](0002-y.md)', provenance: GOOD_PROVENANCE }),
      '0002-y.md': adr({ status: 'Accepted 2026-10-01', provenance: GOOD_PROVENANCE }),
    },
    ['--today', '2026-11-13'],
  );
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /^FAIL .*0001-x\.md: .*0002-y\.md does not link back/m);
});

test('Missing Revisit triggers on an Accepted ADR is a finding', () => {
  const r = run(
    { '0001-x.md': adr({ status: 'Accepted 2026-11-10', provenance: GOOD_PROVENANCE, revisit: false }) },
    ['--today', '2026-11-13'],
  );
  assert.match(r.out, /^WARN .*0001-x\.md: .*Revisit triggers/m);
});

test('A "Revisit when" heading counts as revisit triggers', () => {
  const body = adr({ status: 'Accepted 2026-11-10', provenance: GOOD_PROVENANCE, revisit: false }) + '\n## Revisit when\n\n- X.\n';
  const r = run({ '0001-x.md': body }, ['--today', '2026-11-13']);
  assert.doesNotMatch(r.out, /Revisit triggers/);
});

test('Index and template files are skipped', () => {
  const r = run({ 'README.md': '# ADRs\n', 'template.md': '# Title\n' }, ['--today', '2026-11-13']);
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /^(INFO|WARN|FAIL) /m);
});

test('GitHub Actions annotations are emitted when running in Actions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adr-fitness-'));
  writeFileSync(join(dir, '0001-x.md'), adr({ status: 'Accepted 2026-10-01' }));
  const res = spawnSync(process.execPath, [SCRIPT, '--adr-dir', dir, '--today', '2026-11-13'], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: 'true' },
  });
  assert.match(res.stdout, /^::error file=.*0001-x\.md::/m);
});
