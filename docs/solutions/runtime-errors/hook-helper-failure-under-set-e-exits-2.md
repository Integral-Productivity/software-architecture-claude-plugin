---
title: "A failing helper under set -euo pipefail can make a warn-only hook exit 2 and block the tool"
date: 2026-10-29
category: runtime-errors
module: hooks / governing-document anchor hooks
problem_type: runtime_error
component: tooling
severity: high
symptoms:
  - "A hook documented as warn-only exits with status 2 instead of 0"
  - "Claude Code blocks the tool call or skill start the hook was only meant to annotate"
  - "awk or sed prints a cannot-open error on stderr from inside the hook"
root_cause: missing_validation
resolution_type: code_fix
related_components:
  - testing_framework
tags:
  - claude-code-hooks
  - bash
  - set-e
  - pipefail
  - exit-codes
  - warn-mode
  - fail-open
---

# A failing helper under set -euo pipefail can make a warn-only hook exit 2 and block the tool

## Problem

The skill-start reminder hook (`hooks/anchors-reminder.sh`) runs with `set -euo pipefail` and reads `STRATEGY.md` through an awk helper inside a command substitution. When that file exists but cannot be read, awk fails, `set -e` ends the script with awk's own exit status, and that status is 2. In Claude Code, exit 2 from a PreToolUse hook blocks the tool, and the same hook also runs on UserPromptSubmit, where exit 2 blocks the prompt. So a hook whose contract is "add context, never deny" could stop the skill it was meant to remind.

## Symptoms

- The hook exits 2, not 0, and prints `awk: cannot open ...` on stderr.
- The tool call or skill start that triggered the hook is blocked.
- No test caught it: every fixture repository had readable anchor files.

## What Didn't Work

- The guard `[[ -f "$ROOT/STRATEGY.md" ]]` was not enough. `-f` is true for a file that exists but has no read permission.
- Relying on "the script exits early on bad input" was not enough. The early exits (`|| exit 0`) cover the expected no-match paths. They do not cover a command that fails later, inside `$(...)`.

The defect was found by code review on this branch, not in use.

## Solution

Guard the read, and keep the helper failure from reaching `set -e`:

```bash
# before
if [[ -f "$ROOT/STRATEGY.md" ]]; then
  for HEADING in "Boundaries" "Key metrics"; do
    BODY="$(section "$ROOT/STRATEGY.md" "$HEADING")"

# after
if [[ -f "$ROOT/STRATEGY.md" && -r "$ROOT/STRATEGY.md" ]]; then
  for HEADING in "Boundaries" "Key metrics"; do
    BODY="$(section "$ROOT/STRATEGY.md" "$HEADING" 2>/dev/null || true)"
```

`hooks/anchors-reminder.sh` has the fixed form (the `-r` guard and `2>/dev/null || true` on the `section` call). A test in `test/anchors.test.mjs` makes `STRATEGY.md` unreadable and asserts exit 0 and empty stderr. That test skips when it runs as root, because root can read a mode-000 file.

## Why This Works

`set -e` does not turn a failure into exit 1. It exits with the status of the command that failed. Some standard tools use status 2 for a file or usage error: awk did here, and grep documents 2 for errors. Claude Code gives exit 2 a special meaning for hooks: block, and show stderr to the model. So under `set -e`, any tool that fails with 2 becomes a deny decision, even in a hook that never writes one. The `|| true` keeps the failure inside the substitution, and the `-r` check skips the read when it cannot succeed. An unreadable file now takes the same branch as a missing one, so the hook still prints its reminder and exits 0, which is the warn-only behaviour the contract asks for. If `section` fails for another reason, the body falls back to "(section not found)".

A quick reproduction:

```bash
bash -c 'set -euo pipefail; x="$(awk 1 /nonexistent/file)"; echo after'; echo "exit=$?"
# awk: cannot open "/nonexistent/file" ...
# exit=2
```

## Prevention

- In any hook that must fail open, treat every command that reads a file or parses input as a possible exit 2. Guard it with `2>/dev/null || true`, or with an explicit `|| exit 0`.
- Check readability with `-r`, not only existence with `-f`.
- Prefer one shared helper for file reads in a hook family, so the guard is written once. Here `section` is still local to `hooks/anchors-reminder.sh`; moving it into `hooks/lib/anchors-common.sh` would let other hooks reuse the guarded form.
- Add a test per hook that feeds it an unreadable or malformed file and asserts exit 0 and empty stderr, in addition to the no-match and malformed-JSON tests.
- When reviewing a hook, read `set -e` plus any non-zero-exiting tool as "this line can deny", and ask what happens if it fails.
