#!/usr/bin/env bash
#
# Hook 6: PreToolUse (Write of a NEW capability file) — placement fit check
#
# When a Write creates a file that adds a new capability to a host — a
# skill, command, agent, hook, ADR, or plugin manifest — remind the agent
# to run the placement fit check (software-architecture:conceptual-integrity)
# and to record the verdict as a `Placement fit:` line (SAE-027).
#
# A capability file is one of:
#   - `.../.claude-plugin/plugin.json` or `.../docs/adr/<name>.md`, anywhere
#   - `<root>/skills/<name>/SKILL.md`, `<root>/commands/<name>.md`,
#     `<root>/agents/<name>.md` or `<root>/hooks/<name>`, where <root>
#     holds `.claude-plugin/plugin.json` or is itself named `.claude`
#     (so an app's `src/hooks/useAuth.ts` stays silent)
#
# "New" means the path does not exist yet. A relative path resolves
# against the payload `cwd`.
#
# This hook only adds context. It never denies the Write, and the reminder
# arrives as the file is created, so it tells the agent to remove the file
# on a Misfit verdict without an explicit override. The verdict rules live
# in the skill, not here.
#
# Safety: the path is data. It reaches only `[[ ]]` tests and `jq --arg`,
# never eval, a command substitution, or an external command.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "placement".

set -euo pipefail

if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",placement,"* ]]; then
    exit 0
  fi
fi

# jq is this hook's only runtime dependency; without it, stay silent.
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(jq -r '.tool_name // empty' <<<"$INPUT")"
FILE_PATH="$(jq -r '.tool_input.file_path // empty' <<<"$INPUT")"
CWD="$(jq -r '.cwd // empty' <<<"$INPUT")"

if [[ "$TOOL_NAME" != "Write" || -z "$FILE_PATH" ]]; then
  exit 0
fi

if [[ "$FILE_PATH" != /* ]]; then
  FILE_PATH="${CWD:-$PWD}/$FILE_PATH"
fi

# An existing file is an edit to a capability, not a new one.
if [[ -e "$FILE_PATH" ]]; then
  exit 0
fi

ANYWHERE_RE='/(\.claude-plugin/plugin\.json|docs/adr/[^/]+\.md)$'
ROOTED_RE='^(.*)/(skills/[^/]+/SKILL\.md|commands/[^/]+\.md|agents/[^/]+\.md|hooks/[^/]+)$'

MATCH=false
if [[ "$FILE_PATH" =~ $ANYWHERE_RE ]]; then
  MATCH=true
elif [[ "$FILE_PATH" =~ $ROOTED_RE ]]; then
  ROOT="${BASH_REMATCH[1]}"
  if [[ -f "$ROOT/.claude-plugin/plugin.json" || "${ROOT##*/}" == ".claude" ]]; then
    MATCH=true
  fi
fi

if [[ "$MATCH" == "false" ]]; then
  exit 0
fi

MESSAGE="🧭 **New capability file**: this Write creates \`${FILE_PATH}\`, a new capability in its host. Before you write anything else, run the placement fit check (\`software-architecture:conceptual-integrity\`, or \`/software-architecture:place\`) and state the verdict as a \`Placement fit: <Strong|Weak|Misfit> — <reason>\` line in the commit message, repeated in the PR body or ADR. If the verdict is Misfit and the user gives no explicit override, remove the file you just created and propose a better home."

jq -n --arg msg "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": $msg
  }
}'
