#!/usr/bin/env bash
#
# Hook 8: PreToolUse (Skill) and UserPromptSubmit -- skill-start anchor reminder
#
# When compound-engineering ce-work, ce-debug, ce-code-review or lfg starts --
# through the Skill tool or a typed slash command -- in a repository with
# STRATEGY.md or QUALITY.md, add the STRATEGY.md Boundaries and Key metrics and
# a pointer to the QUALITY.md requirements. Those steps do not read the anchors
# themselves yet; each part of this reminder is removed when
# EveryInc/compound-engineering-plugin#1947 ships it upstream (ADR-0005).
#
# Warn only: adds context, never denies. Appends one `remind` line to the
# local evidence log. Does not need SA_ANCHORS_OWNERS, because it fires only
# where an anchor already exists.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "anchors-reminder", or a
# .anchors-opt-out file at the repository root.

set -euo pipefail

# shellcheck source=lib/anchors-common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/anchors-common.sh"

anchors_enabled anchors-reminder || exit 0
command -v jq >/dev/null 2>&1 || exit 0

INPUT="$(cat)"
# Cheap prefilter: this hook runs on every prompt, and only these names matter.
[[ "$INPUT" == *ce-work* || "$INPUT" == *ce-debug* || "$INPUT" == *ce-code-review* || "$INPUT" == *lfg* ]] || exit 0
CWD="$(anchors_field "$INPUT" '.cwd')"
[[ -n "$CWD" ]] || exit 0

SKILLS='(compound-engineering:)?(ce-work|ce-debug|ce-code-review|lfg)'
if [[ "$(anchors_field "$INPUT" '.tool_name')" == "Skill" ]]; then
  EVENT="PreToolUse"
  SKILL="$(anchors_field "$INPUT" '.tool_input.skill // .tool_input.command')"
  SKILL="${SKILL#/}"
  [[ "$SKILL" =~ ^${SKILLS}$ ]] || exit 0
else
  EVENT="UserPromptSubmit"
  PROMPT="$(anchors_field "$INPUT" '.prompt')"
  PROMPT="${PROMPT%%$'\n'*}"
  [[ "$PROMPT" =~ ^/(${SKILLS})([[:space:]]|$) ]] || exit 0
  SKILL="${BASH_REMATCH[1]}"
fi

ROOT="$(anchors_repo_root "$CWD")" || exit 0
anchors_opted_out "$ROOT" && exit 0
[[ -f "$ROOT/STRATEGY.md" || -f "$ROOT/QUALITY.md" ]] || exit 0

CAP=2000

# section FILE HEADING -- the body of a level-2 section, cut near CAP bytes.
section() {
  awk -v heading="## $2" -v cap="$CAP" '
    $0 == heading { inside = 1; next }
    inside && /^#{1,2}[[:space:]]/ { exit }
    inside {
      if (used + length($0) > cap) { print "... (truncated; read the full section in the file)"; exit }
      used += length($0) + 1
      print
    }
  ' "$1" | sed -e '/./,$!d'
}

MESSAGE="📐 Repository anchors for ${SKILL}. This step does not load them itself, so keep this work inside them and say which ones apply."
MISSING=()
if [[ -f "$ROOT/STRATEGY.md" && -r "$ROOT/STRATEGY.md" ]]; then
  for HEADING in "Boundaries" "Key metrics"; do
    BODY="$(section "$ROOT/STRATEGY.md" "$HEADING" 2>/dev/null || true)"
    MESSAGE+=$'\n\n'"STRATEGY.md ${HEADING}:"$'\n'"${BODY:-(section not found)}"
  done
else
  MISSING+=("STRATEGY.md")
fi
if [[ -f "$ROOT/QUALITY.md" ]]; then
  MESSAGE+=$'\n\n'"QUALITY.md: read its factors and requirements at ${ROOT}/QUALITY.md before you change code; every change must keep them."
else
  MISSING+=("QUALITY.md")
fi
for ANCHOR in ${MISSING[@]+"${MISSING[@]}"}; do
  MESSAGE+=$'\n\n'"Missing: ${ANCHOR}. Create it with $(anchors_creator "$ANCHOR"), or ask the operator to."
done

REPO=""
if GITDIR="$(anchors_common_git_dir "$ROOT")"; then
  REPO="$(anchors_repo_name "$GITDIR")"
fi
anchors_log remind "$REPO" "$SKILL" "$(anchors_join , ${MISSING[@]+"${MISSING[@]}"})"

jq -n --arg event "$EVENT" --arg ctx "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": $event,
    "additionalContext": $ctx
  }
}'
