# 5. Warn before a change when governing documents are unread

Date: 2026-10-29

## Status

Accepted

Implements the "Governing-document anchors" track in [STRATEGY.md](../../STRATEGY.md).

## Context

The plugin's hooks already surface ADRs and the Technology Radar. They do not
check that the other governing documents of a repository were consulted before
an agent changes it: STRATEGY.md (purpose, Boundaries, Key metrics), QUALITY.md
(the quality model, qualitymd format) and ARCHITECTURE.md (governance routing,
when the repository has one).

compound-engineering (checked on version 3.33.1) closes part of this gap.
ce-brainstorm and ce-plan read STRATEGY.md, and its experimental Compound Packs
carry prescriptive rules into ce-plan, ce-brainstorm, the full ce-code-review
path and ce-doc-review. Four gaps remain: ce-work, ce-debug and lfg do not read
STRATEGY.md Boundaries, ce-code-review grades against AGENTS.md and CLAUDE.md
but not STRATEGY.md, nothing reads QUALITY.md, and no step checks Key metrics.
An upstream request asks compound-engineering to close them natively
(EveryInc/compound-engineering-plugin#1947).

STRATEGY.md constrains the answer: hooks are opt-out, warn before they block,
stay silent when they have nothing to say, keep no state across sessions, and
the code hard-codes no organization. QUALITY.md adds a security veto (hooks
never execute their input) and a privacy veto (no personal data in tracked
files).

## Decision

**Three hooks and one Compound Pack, all in this plugin.** A new repository was
considered and rejected: the concept, vocabulary and mechanism already live
here.

1. **Read tracker** (PostToolUse on `Read|Bash`). When the session reads
   STRATEGY.md, QUALITY.md or ARCHITECTURE.md at a repository root, with the
   Read tool or a plain read command in Bash, it records the read in a marker
   directory keyed by the session id and the repository's common git
   directory, under the system temporary directory.
2. **Gate** (PreToolUse on `Write|Edit|NotebookEdit|Bash`). Before the first
   change in a repository, it adds a warning when STRATEGY.md or QUALITY.md is
   missing or unread, or ARCHITECTURE.md exists but is unread. A change is any
   file change, docs included: Write, Edit, NotebookEdit, and a Bash command
   that commits or writes files by a detectable pattern. It warns once per
   repository per session and names the skill that creates a missing document.
3. **Skill-start reminder** (PreToolUse on `Skill`, and UserPromptSubmit for a
   typed slash command). When compound-engineering ce-work, ce-debug,
   ce-code-review or lfg starts in a repository with STRATEGY.md or
   QUALITY.md, it adds the STRATEGY.md Boundaries and Key metrics and a pointer
   to the QUALITY.md requirements. Each part is removed when #1947 ships it
   upstream.
4. **Compound Pack** at `packs/repo-anchors/`, with three rules:
   strategy-boundaries, quality-requirements and key-metrics. Consumers declare
   it in `.compound-engineering/config.yaml` pinned to a release tag (ADR-0004).

**Warn only.** No hook denies a call. A switch to deny needs a PR the operator
approves after about two weeks of log evidence. An automatic switch and a
permanent warn mode were both rejected.

**Consulted means read in this session.** "Read since the last change" and
"present on disk" were rejected. Markers live only for the session that wrote
them; a new session starts with nothing read.

**Scope is a configured owner list.** `SA_ANCHORS_OWNERS` holds a
comma-separated list of repository owners, matched case-insensitively against
the `origin` remote read from the git config file (no `git` process is
spawned); `*` matches every repository. **When the variable is unset, the gate
is silent.** This is the least surprising default for a public plugin: an
installer who has not opted in gets no new warnings in unrelated repositories,
the same as an unset `SA_RADAR_PATH`. The reminder does not need the owner
list, because it fires only when the repository already has an anchor.

**Opt-out.** A `.anchors-opt-out` file at a repository root silences all three
hooks there. `SA_PLUGIN_HOOKS` gains two keys: `anchors` (read tracker and
gate) and `anchors-reminder`.

**Evidence log.** The gate and the reminder append one tab-separated line per
event (`warn`, `pass`, `read-after-warn`, `remind`) to
`${XDG_STATE_HOME:-$HOME/.local/state}/software-architecture/anchors.log`, or
to the path in `SA_ANCHORS_LOG`; `SA_ANCHORS_LOG=off` turns it off. `pass` and
`warn` lines together give the denominator for the "Context before change"
metric. Hooks only append to the log and never read it, so no hook behavior
depends on another session. The log holds no prompt text and no paths beyond
the repository's `owner/name`.

## Consequences

- Agents in an opted-in repository see which governing documents to read
  before their first change, and compound-engineering steps that do not read
  them get their key sections in context.
- The gate is inert until an environment sets `SA_ANCHORS_OWNERS`. The warn
  period starts on that date.
- A cloud container discards its home directory with the session, so its
  evidence survives only when the environment points `SA_ANCHORS_LOG` at a
  persisted path.
- Bash detection is pattern-based. A missed write costs a warning, never a
  block; a false match costs at most one warning per repository per session.
- Compound Packs are experimental upstream; a consumer pins a release tag and
  watches release notes.

## Revisit when

- The two-week warn period ends (deny-mode decision).
- compound-engineering ships any part of #1947 (remove the matching part of the
  reminder).
- Compound Packs change their file format.
