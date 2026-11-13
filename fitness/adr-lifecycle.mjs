#!/usr/bin/env node
// ADR lifecycle fitness function (ADR-0009).
//
// Runs the mechanical ADR checks on every ADR in a directory and reports each
// finding at a severity set by the ADR's lifecycle state:
//   Proposed                                   -> INFO
//   Accepted/Amended, within the curing period  -> WARN
//   Accepted/Amended, after the curing period   -> FAIL (exit 1)
//   Superseded/Deprecated/Rejected/Reclassified -> INFO
// A broken supersession back-link takes the successor's severity.
//
// Judgment checks (scope, feature smell) are not here: they belong to the
// adr-reviewer agent. No dependencies; reads files only; never writes.
//
// Usage: node fitness/adr-lifecycle.mjs [--adr-dir DIR] [--curing-days N]
//          [--since YYYY-MM-DD] [--today YYYY-MM-DD]
// Env:   ADR_FITNESS_CURING_DAYS, ADR_FITNESS_SINCE (flags win).

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const DAY = 86_400_000;
const SKIP = new Set(['readme.md', 'index.md', 'template.md', '0000-template.md', 'toc.md']);
const LEVEL_RANK = { INFO: 0, WARN: 1, FAIL: 2 };

function parseArgs(argv) {
  const opts = {
    adrDir: null,
    curingDays: Number(process.env.ADR_FITNESS_CURING_DAYS || 30),
    since: process.env.ADR_FITNESS_SINCE || null,
    today: new Date().toISOString().slice(0, 10),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (k === '--adr-dir') { opts.adrDir = v; i += 1; }
    else if (k === '--curing-days') { opts.curingDays = Number(v); i += 1; }
    else if (k === '--since') { opts.since = v; i += 1; }
    else if (k === '--today') { opts.today = v; i += 1; }
    else throw new Error(`unknown argument: ${k}`);
  }
  if (!opts.adrDir) {
    opts.adrDir = existsSync('.adr-dir') ? readFileSync('.adr-dir', 'utf8').split('\n')[0].trim() : 'docs/adr';
  }
  if (!Number.isFinite(opts.curingDays) || opts.curingDays < 0) throw new Error('--curing-days must be a number >= 0');
  return opts;
}

const toTime = (d) => Date.parse(`${d}T00:00:00Z`);

function section(text, name) {
  const re = new RegExp(`^##\\s+${name}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'mi');
  const m = text.match(re);
  return m ? m[1] : null;
}

function parseStatus(text) {
  const body = section(text, 'Status');
  if (body === null) return { state: null, date: null, line: '' };
  const line = body.split('\n').map((l) => l.trim()).find((l) => l.length > 0) || '';
  const m = line.match(/^(Proposed|Accepted|Amended|Superseded|Deprecated|Rejected|Reclassified)\b/i);
  const date = (line.match(/\b(\d{4}-\d{2}-\d{2})\b/) || [])[1] || null;
  return { state: m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null, date, line, body };
}

const ID_PATTERNS = [
  /[\w.-]+\/[\w.-]+#\d+/, // owner/repo#N
  /github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+/,
  /productboard\.com\/\S+/i,
  /\bpb:[A-Za-z]+:\S+/,
  /\bMTpQbUVudGl0eT[A-Za-z0-9+/=]+/, // Productboard entity ID
  /glassfrog\.com\/\S*project\S*\d/i,
  /glassfrog\s+project\s*[:#]?\s*(\d{3,}|[\w-]*\d[\w-]*)/i,
];

function provenanceFinding(text) {
  const line = text.split('\n').find((l) => /^\s*Provenance:/i.test(l));
  if (!line) return 'no "Provenance:" line naming a tracked work item (GitHub issue, Productboard entity or GlassFrog project)';
  if (!ID_PATTERNS.some((re) => re.test(line))) {
    return 'Provenance names no GitHub issue, Productboard entity or GlassFrog project by ID';
  }
  return null;
}

function severityFor(status, headerDate, opts) {
  if (status.state === 'Accepted' || status.state === 'Amended') {
    const accepted = status.date || headerDate;
    if (!accepted) return { level: 'FAIL', note: '' };
    let start = toTime(accepted);
    if (opts.since && toTime(opts.since) > start) start = toTime(opts.since);
    const cureEnd = start + opts.curingDays * DAY;
    const today = toTime(opts.today);
    if (today < cureEnd) {
      const left = Math.ceil((cureEnd - today) / DAY);
      return { level: 'WARN', note: ` (${left} day${left === 1 ? '' : 's'} left in the curing period)` };
    }
    return { level: 'FAIL', note: '' };
  }
  return { level: status.state ? 'INFO' : 'WARN', note: '' };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const dir = opts.adrDir;
  if (!existsSync(dir)) {
    console.log(`No ADR directory at ${dir}; nothing to check.`);
    return 0;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && !SKIP.has(f.toLowerCase())).sort();
  const adrs = new Map();
  for (const f of files) {
    const text = readFileSync(join(dir, f), 'utf8');
    const headerDate = (text.match(/^Date:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1] || null;
    const status = parseStatus(text);
    adrs.set(f, { text, headerDate, status, severity: severityFor(status, headerDate, opts) });
  }

  const findings = [];
  const add = (file, level, msg) => findings.push({ file, level, msg });

  for (const [f, a] of adrs) {
    const { level, note } = a.severity;
    const at = (msg) => add(f, level, `${msg}${note}`);
    if (!a.status.state) at('no recognised status (Proposed, Accepted, Amended, Superseded, Deprecated, Rejected, Reclassified) under "## Status"');
    else if (!a.status.date) at('status has no date (write e.g. "Accepted 2026-11-13")');
    const prov = provenanceFinding(a.text);
    if (prov) at(prov);
    for (const name of ['Context', 'Decision', 'Consequences']) {
      if (section(a.text, name) === null) at(`missing "## ${name}" section`);
    }
    if ((a.status.state === 'Accepted' || a.status.state === 'Amended') && section(a.text, 'Revisit[^\\n]*') === null) {
      at('missing "## Revisit triggers" section');
    }
    if (a.status.state === 'Superseded') {
      const num = (a.status.body.match(/(?:ADR-|\()(\d{4})/) || [])[1];
      const succ = num && [...adrs.keys()].find((k) => k.startsWith(`${num}-`));
      const self = f.slice(0, 4);
      if (!succ) {
        at('Superseded but names no successor ADR that exists in this directory');
      } else {
        const s = adrs.get(succ);
        if (!new RegExp(`(ADR-${self}\\b|${self}-[\\w-]+\\.md)`).test(s.text)) {
          add(f, s.severity.level, `successor ${succ} does not link back to this ADR${s.severity.note}`);
        }
      }
    }
  }

  const gha = process.env.GITHUB_ACTIONS === 'true';
  for (const x of findings) {
    const path = relative(process.cwd(), join(dir, x.file)) || x.file;
    if (gha) {
      const kind = { INFO: 'notice', WARN: 'warning', FAIL: 'error' }[x.level];
      console.log(`::${kind} file=${path}::${x.msg}`);
    } else {
      console.log(`${x.level} ${path}: ${x.msg}`);
    }
  }
  const worst = findings.reduce((m, x) => Math.max(m, LEVEL_RANK[x.level]), -1);
  const counts = ['INFO', 'WARN', 'FAIL'].map((l) => `${findings.filter((x) => x.level === l).length} ${l.toLowerCase()}`);
  console.log(`ADR lifecycle fitness: ${adrs.size} ADRs, ${counts.join(', ')} (curing period ${opts.curingDays} days).`);
  return worst === LEVEL_RANK.FAIL ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`adr-lifecycle: ${err.message}`);
  process.exitCode = 2;
}
