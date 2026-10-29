#!/usr/bin/env bash
#
# Hook 6: PostToolUse (Read, Bash) -- governing-document read tracker
#
# When the session reads STRATEGY.md, QUALITY.md or ARCHITECTURE.md at a
# repository root -- with the Read tool, or a plain cat/head/tail/less/sed -n
# in Bash -- record the read in a marker directory keyed by this session and
# repository. anchors-gate.sh checks those markers before the first change.
# Markers live under the system temp directory and only this session's id
# reaches them, so no state crosses sessions (ADR-0005).
#
# Never prints anything. If a repository was already warned about in this
# session, the first read of each anchor appends a `read-after-warn` line to
# the evidence log.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "anchors", or a .anchors-opt-out
# file at the repository root.

set -euo pipefail

# shellcheck source=lib/anchors-common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/anchors-common.sh"

anchors_enabled anchors || exit 0
command -v jq >/dev/null 2>&1 || exit 0

INPUT="$(cat)"
SESSION="$(anchors_session_key "$(anchors_field "$INPUT" '.session_id')")"
TOOL_NAME="$(anchors_field "$INPUT" '.tool_name')"
CWD="$(anchors_field "$INPUT" '.cwd')"
[[ -n "$SESSION" && -n "$CWD" ]] || exit 0

# mark_read PATH -- record PATH when it is an anchor at a repository root.
mark_read() {
  local path="$1" base dir root gitdir markers
  base="$(basename "$path")"
  case "$base" in
    STRATEGY.md|QUALITY.md|ARCHITECTURE.md) ;;
    *) return 0 ;;
  esac
  dir="$(anchors_canon_dir "$(dirname "$path")")" || return 0
  root="$(anchors_repo_root "$dir")" || return 0
  [[ "$root" == "$dir" && -f "$root/$base" && ! -e "$root/.anchors-opt-out" ]] || return 0
  gitdir="$(anchors_common_git_dir "$root")" || return 0
  markers="$(anchors_marker_dir "$SESSION" "$gitdir")"
  [[ -e "$markers/read-$base" ]] && return 0
  mkdir -p "$markers" 2>/dev/null || return 0
  : > "$markers/read-$base"
  if [[ -e "$markers/warned" ]]; then
    anchors_log read-after-warn "$(anchors_repo_name "$gitdir")" "$TOOL_NAME" - "$base"
  fi
}

# read_command SEGMENT -- mark the files a plain read command names. Words are
# split, never evaluated; a segment with a pipe, redirect or expansion is not
# a plain read and is skipped.
read_command() {
  local words word i=1
  read -ra words <<< "$1"
  [[ ${#words[@]} -gt 1 ]] || return 0
  case "${words[0]}" in
    cd) CWD="$(anchors_abspath "${words[1]}" "$CWD")"; return 0 ;;
    cat|head|tail|less) ;;
    sed) [[ "${words[1]}" == "-n" ]] || return 0; i=3 ;;
    *) return 0 ;;
  esac
  for ((; i < ${#words[@]}; i++)); do
    word="${words[i]}"
    [[ "$word" == -* ]] && continue
    word="${word#[\"\']}"
    word="${word%[\"\']}"
    mark_read "$(anchors_abspath "$word" "$CWD")"
  done
}

case "$TOOL_NAME" in
  Read)
    FILE_PATH="$(anchors_field "$INPUT" '.tool_input.file_path')"
    [[ -n "$FILE_PATH" ]] && mark_read "$(anchors_abspath "$FILE_PATH" "$CWD")"
    ;;
  Bash)
    COMMAND="$(anchors_field "$INPUT" '.tool_input.command')"
    COMMAND="${COMMAND//&&/;}"
    IFS=';' read -ra SEGMENTS <<< "${COMMAND//$'\n'/;}"
    for SEGMENT in ${SEGMENTS[@]+"${SEGMENTS[@]}"}; do
      [[ "$SEGMENT" =~ [\|\<\>\$\`\&] ]] && continue
      read_command "$SEGMENT"
    done
    ;;
esac

exit 0
