#!/usr/bin/env bash
#
# Hook 4: Stop — end-of-session decision sweep reminder
#
# Emits a single end-of-session reminder: if the session made
# architectural decisions, capture via /software-architecture:decide.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "stop".

set -euo pipefail

if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",stop,"* ]]; then
    exit 0
  fi
fi

# Only fire when actually in a git repo (otherwise the suggestion is noise)
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

# Only fire when there's been meaningful change in the worktree
CHANGED_LINES=$(git diff --shortstat HEAD 2>/dev/null | grep -oE '[0-9]+ (insertion|deletion)' | head -1 || true)
NEW_FILES=$(git status --porcelain 2>/dev/null | grep -cE '^\?\?' || true)

if [[ -z "$CHANGED_LINES" && "$NEW_FILES" -eq 0 ]]; then
  exit 0
fi

MESSAGE="🏁 Before closing this session — if architectural decisions were made (new services, dependency changes, structural refactors, contract changes), capture them via \`/software-architecture:decide\` so the reasoning isn't lost. Use \`/software-architecture:review\` to check the diff against existing ADRs and fitness functions."

jq -n --arg msg "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": $msg
  }
}'
