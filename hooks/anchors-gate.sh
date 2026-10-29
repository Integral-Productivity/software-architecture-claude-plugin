#!/usr/bin/env bash
#
# Hook 7: PreToolUse (Write, Edit, NotebookEdit, Bash) -- governing-document gate
#
# Before the first change to a repository in a session, warn when its
# STRATEGY.md or QUALITY.md is missing or unread, or its ARCHITECTURE.md
# exists but is unread. Reads are recorded by anchors-read.sh.
#
# Warn mode only: the hook adds context and never denies (ADR-0005). It
# decides once per repository per session, and appends one `warn` or `pass`
# line to the local evidence log.
#
# Scope: repositories whose origin owner is listed in SA_ANCHORS_OWNERS
# (comma-separated, case-insensitive; "*" for all). Unset means silent.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "anchors", or a .anchors-opt-out
# file at the repository root.

set -euo pipefail

# shellcheck source=lib/anchors-common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/anchors-common.sh"

anchors_enabled anchors || exit 0
[[ -n "${SA_ANCHORS_OWNERS:-}" ]] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

INPUT="$(cat)"
SESSION="$(anchors_session_key "$(anchors_field "$INPUT" '.session_id')")"
TOOL_NAME="$(anchors_field "$INPUT" '.tool_name')"
CWD="$(anchors_field "$INPUT" '.cwd')"
[[ -n "$SESSION" && -n "$CWD" ]] || exit 0

# is_change COMMAND -- true when a shell command commits or writes files by a
# detectable pattern. Conservative: a miss costs a warning, never a block.
is_change() {
  local command words='(^|[[:space:];&|(])'
  command="$(anchors_strip_null_redirects "$1")"
  [[ "$command" == *">"* ]] && return 0
  [[ "$command" =~ ${words}git[[:space:]]+(commit|apply)([[:space:]]|$) ]] && return 0
  [[ "$command" =~ ${words}sed[[:space:]]+(-[A-Za-z]*i|--in-place) ]] && return 0
  [[ "$command" =~ ${words}perl[[:space:]]+-[A-Za-z]*i ]] && return 0
  [[ "$command" =~ ${words}(tee|mv|cp|rm|touch)([[:space:]]|$) ]] && return 0
  return 1
}

case "$TOOL_NAME" in
  Write|Edit) TARGET="$(anchors_field "$INPUT" '.tool_input.file_path')" ;;
  NotebookEdit) TARGET="$(anchors_field "$INPUT" '.tool_input.notebook_path')" ;;
  Bash)
    is_change "$(anchors_field "$INPUT" '.tool_input.command')" || exit 0
    TARGET="$CWD/."
    ;;
  *) exit 0 ;;
esac
[[ -n "$TARGET" ]] || exit 0

ROOT="$(anchors_repo_root "$(dirname "$(anchors_abspath "$TARGET" "$CWD")")")" || exit 0
anchors_opted_out "$ROOT" && exit 0
GITDIR="$(anchors_common_git_dir "$ROOT")" || exit 0
REPO="$(anchors_repo_name "$GITDIR")"
anchors_owner_in_scope "${REPO%%/*}" || exit 0

MARKERS="$(anchors_marker_dir "$SESSION" "$GITDIR")"
[[ -e "$MARKERS/checked" ]] && exit 0
mkdir -p "$MARKERS" 2>/dev/null || exit 0
: > "$MARKERS/checked"

MISSING=()
UNREAD=()
for ANCHOR in STRATEGY.md QUALITY.md ARCHITECTURE.md; do
  if [[ ! -f "$ROOT/$ANCHOR" ]]; then
    [[ "$ANCHOR" == "ARCHITECTURE.md" ]] || MISSING+=("$ANCHOR")
  elif [[ ! -e "$MARKERS/read-$ANCHOR" ]]; then
    UNREAD+=("$ANCHOR")
  fi
done

if [[ ${#MISSING[@]} -eq 0 && ${#UNREAD[@]} -eq 0 ]]; then
  anchors_log pass "$REPO" "$TOOL_NAME"
  exit 0
fi

: > "$MARKERS/warned"
anchors_log warn "$REPO" "$TOOL_NAME" "$(anchors_join , ${MISSING[@]+"${MISSING[@]}"})" "$(anchors_join , ${UNREAD[@]+"${UNREAD[@]}"})"

MESSAGE="📐 Governing documents for ${REPO} are not yet consulted in this session. Before the first change:"
if [[ ${#UNREAD[@]} -gt 0 ]]; then
  MESSAGE+=$'\n'"- Unread: $(anchors_join , ${UNREAD[@]+"${UNREAD[@]}"} | sed 's/,/, /g')"
  MESSAGE+=$'\n'"  Read each one at ${ROOT} and keep this change inside the strategy Boundaries and the quality requirements."
fi
for ANCHOR in ${MISSING[@]+"${MISSING[@]}"}; do
  MESSAGE+=$'\n'"- Missing: ${ANCHOR}. Create it with $(anchors_creator "$ANCHOR"), or ask the operator to."
done
MESSAGE+=$'\n'"This is a warning, not a block (ADR-0005). It appears once per repository per session."

jq -n --arg ctx "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": $ctx
  }
}'
