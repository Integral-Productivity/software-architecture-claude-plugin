#!/usr/bin/env bash
#
# Hook 5: PreToolUse (ExitPlanMode) — architectural review before plan submission
#
# When the user is about to submit a plan for review AND there's a
# non-trivial diff in the current worktree, emit a system reminder that
# triggers the architecture-reviewer agent (Opus).
#
# Thresholds: > 50 lines OR new files.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "planreview".

set -euo pipefail

if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",planreview,"* ]]; then
    exit 0
  fi
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"

if [[ "$TOOL_NAME" != "ExitPlanMode" ]]; then
  exit 0
fi

# Only fire inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

# Check diff size
CHANGED_LINES=$(git diff --shortstat HEAD 2>/dev/null | grep -oE '[0-9]+' | head -2 | paste -sd+ - | bc 2>/dev/null || echo 0)
NEW_FILES=$(git status --porcelain 2>/dev/null | grep -cE '^\?\?' || echo 0)

if [[ "${CHANGED_LINES:-0}" -lt 50 && "${NEW_FILES:-0}" -eq 0 ]]; then
  exit 0
fi

# Emit a reminder that triggers architecture-reviewer
MESSAGE="🏛️  Pre-plan-submission architectural check:

This worktree has ${CHANGED_LINES:-0} changed lines and ${NEW_FILES:-0} new files. Before the plan goes out for review, consider dispatching the \`architecture-reviewer\` subagent (model: Opus) to check the diff against existing ADRs, fitness functions, and radar entries.

Suggested invocation:
\`\`\`
Agent({
  subagent_type: \"software-architecture:architecture-reviewer\",
  description: \"Architectural review of plan-mode diff\",
  prompt: \"Review the current diff against base branch. Check: prior ADRs touched, fitness functions impacted, radar conflicts (Hold-ring deps), implicit decisions needing ADRs.\"
})
\`\`\`

You can decline if the changes are clearly out-of-scope for architectural review (e.g., docs-only, formatting)."

jq -n --arg msg "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": $msg
  }
}'
