// Optional OTLP sink for anchors evidence events (issue #96, ADR-0005).
//
// Each test names the scenario it covers in
// docs/scenarios/governing-document-anchors.feature. A local HTTP server
// stands in for the OTLP endpoint, so no test reaches the network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROOT } from './lib/repo.mjs';

const HAS_TOOLS = spawnSync('jq', ['--version']).status === 0 && spawnSync('curl', ['--version']).status === 0;
const QUALITY = '# Quality\n\n## Factors\n\n- Security\n';

function sandbox(t) {
  const base = mkdtempSync(join(tmpdir(), 'sa-otlp-test-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  mkdirSync(join(base, 'tmp'));
  const root = join(base, 'widgets');
  mkdirSync(join(root, '.git'), { recursive: true });
  writeFileSync(join(root, '.git', 'config'), '[remote "origin"]\n\turl = git@github.com:Acme/widgets.git\n');
  writeFileSync(join(root, 'QUALITY.md'), QUALITY);
  return {
    base,
    root,
    log: join(base, 'state', 'software-architecture', 'anchors.log'),
    env: { TMPDIR: join(base, 'tmp'), XDG_STATE_HOME: join(base, 'state'), SA_ANCHORS_OWNERS: 'acme' },
  };
}

/** A local endpoint that records every request it receives. */
async function endpoint(t) {
  const requests = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  return { url: `http://127.0.0.1:${server.address().port}`, requests };
}

/** Run the gate on an Edit, without blocking the event loop. */
function gate(s, extraEnv) {
  const env = { ...process.env, ...s.env, ...extraEnv };
  for (const key of ['SA_ANCHORS_LOG', 'SA_PLUGIN_HOOKS', 'SA_ANCHORS_OTLP', 'SA_ANCHORS_OTLP_HEADERS']) {
    if (!(key in (extraEnv || {}))) delete env[key];
  }
  const payload = JSON.stringify({
    session_id: 'session-1', cwd: s.root, hook_event_name: 'PreToolUse', tool_name: 'Edit',
    tool_input: { file_path: join(s.root, 'a.ts'), old_string: 'a', new_string: 'b' },
  });
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('bash', [join(ROOT, 'hooks', 'anchors-gate.sh')], { env, cwd: ROOT });
    let stdout = '';
    child.stdout.on('data', (c) => { stdout += c; });
    child.on('close', (code) => resolve({ code, stdout, ms: Date.now() - started }));
    child.stdin.end(payload);
  });
}

const until = async (cond, ms = 3000) => {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await new Promise((r) => setTimeout(r, 25));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const logLines = (p) => (existsSync(p) ? readFileSync(p, 'utf8').trim().split('\n').filter(Boolean) : []);
const attrs = (list) => Object.fromEntries(list.map((a) => [a.key, a.value.stringValue]));

test('otlp: an evidence event is also sent as one OTLP log record', async (t) => {
  if (!HAS_TOOLS) return t.skip('jq or curl not installed');
  const s = sandbox(t);
  const ep = await endpoint(t);

  const r = await gate(s, { SA_ANCHORS_OTLP: `${ep.url}/` });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Unread/);
  assert.equal(logLines(s.log).length, 1, 'the file log still gets its line');

  await until(() => ep.requests.length > 0);
  assert.equal(ep.requests.length, 1);
  const [req] = ep.requests;
  assert.equal(req.method, 'POST');
  assert.equal(req.url, '/v1/logs');
  assert.match(req.headers['content-type'], /application\/json/);

  const body = JSON.parse(req.body);
  const rl = body.resourceLogs[0];
  assert.equal(attrs(rl.resource.attributes)['service.name'], 'software-architecture');
  const rec = rl.scopeLogs[0].logRecords[0];
  assert.match(rec.timeUnixNano, /^\d{19}$/);
  assert.equal(rec.body.stringValue, 'warn');
  assert.deepEqual(attrs(rec.attributes), {
    'anchors.event': 'warn',
    'anchors.repo.owner': 'Acme',
    'anchors.repo.name': 'widgets',
    'anchors.tool': 'Edit',
    'anchors.missing': 'STRATEGY.md',
    'anchors.unread': 'QUALITY.md',
  });
  assert.ok(!req.body.includes(s.base), 'no local path leaves the machine');
});

test('otlp: a header variable adds request headers', async (t) => {
  if (!HAS_TOOLS) return t.skip('jq or curl not installed');
  const s = sandbox(t);
  const ep = await endpoint(t);

  await gate(s, { SA_ANCHORS_OTLP: ep.url, SA_ANCHORS_OTLP_HEADERS: 'Authorization=Basic dGVzdA==,X-Scope-OrgID=team-a' });
  await until(() => ep.requests.length > 0);
  assert.equal(ep.requests[0].headers.authorization, 'Basic dGVzdA==');
  assert.equal(ep.requests[0].headers['x-scope-orgid'], 'team-a');
});

test('otlp: nothing is sent when the endpoint is unset or off', async (t) => {
  if (!HAS_TOOLS) return t.skip('jq or curl not installed');
  const ep = await endpoint(t);
  for (const extra of [{}, { SA_ANCHORS_OTLP: 'off' }]) {
    const s = sandbox(t);
    const r = await gate(s, { ...extra, SA_ANCHORS_OTLP_HEADERS: `X-Endpoint=${ep.url}` });
    assert.equal(r.code, 0);
    assert.equal(logLines(s.log).length, 1);
  }
  await sleep(400);
  assert.equal(ep.requests.length, 0);
});

test('otlp: an endpoint that never answers never fails or delays the hook', async (t) => {
  if (!HAS_TOOLS) return t.skip('jq or curl not installed');
  const s = sandbox(t);
  // A local server that accepts the request and never answers: a blocking
  // send would hold the hook for curl's whole 2-second limit.
  const sockets = new Set();
  const server = createServer(() => {});
  server.on('connection', (c) => sockets.add(c));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => { for (const c of sockets) c.destroy(); server.close(); });

  const r = await gate(s, { SA_ANCHORS_OTLP: `http://127.0.0.1:${server.address().port}` });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Unread/);
  assert.ok(r.ms < 1500, `hook took ${r.ms} ms`);
  assert.equal(logLines(s.log).length, 1);
});

test('otlp: quotes and backslashes in a field stay valid JSON', async (t) => {
  if (!HAS_TOOLS) return t.skip('jq or curl not installed');
  const s = sandbox(t);
  writeFileSync(join(s.root, '.git', 'config'), '[remote "origin"]\n\turl = git@github.com:Ac"me/wid\\\\gets.git\n');
  const ep = await endpoint(t);
  await gate(s, { SA_ANCHORS_OTLP: ep.url, SA_ANCHORS_OWNERS: '*' });
  await until(() => ep.requests.length > 0);
  const rec = JSON.parse(ep.requests[0].body).resourceLogs[0].scopeLogs[0].logRecords[0];
  assert.equal(attrs(rec.attributes)['anchors.repo.owner'], 'Ac"me');
});
