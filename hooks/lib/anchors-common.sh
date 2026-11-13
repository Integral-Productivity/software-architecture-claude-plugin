#!/usr/bin/env bash
#
# Shared helpers for the governing-document anchor hooks (ADR-0005):
# anchors-read.sh, anchors-gate.sh and anchors-reminder.sh source this file.
#
# "Anchors" are STRATEGY.md, QUALITY.md and ARCHITECTURE.md at a repository
# root. Everything here reads files only: no git process and no input is ever
# evaluated as code. The one network call is the optional OTLP sink.

# anchors_enabled KEY -- false when SA_PLUGIN_HOOKS is set and lacks KEY.
anchors_enabled() {
  [[ -z "${SA_PLUGIN_HOOKS:-}" || ",$SA_PLUGIN_HOOKS," == *",$1,"* ]]
}

# anchors_field INPUT FILTER -- one jq field as raw text; empty on bad input.
anchors_field() {
  printf '%s' "$1" | jq -r "$2 // empty" 2>/dev/null || true
}

# anchors_session_key ID -- the session id reduced to [A-Za-z0-9-].
anchors_session_key() {
  printf '%s' "$1" | tr -cd 'A-Za-z0-9-'
}

# anchors_abspath PATH CWD -- PATH made absolute against CWD (text only).
anchors_abspath() {
  if [[ "$1" == /* ]]; then printf '%s' "$1"; else printf '%s/%s' "$2" "$1"; fi
}

# anchors_canon_dir DIR -- physical path of an existing directory.
anchors_canon_dir() {
  (cd "$1" 2>/dev/null && pwd -P)
}

# anchors_repo_root DIR -- nearest ancestor of DIR (or DIR) holding .git.
# DIR need not exist yet (a Write can create new directories).
anchors_repo_root() {
  local dir="$1"
  while [[ -n "$dir" && "$dir" != "/" && "$dir" != "." ]]; do
    if [[ -e "$dir/.git" ]]; then
      anchors_canon_dir "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

# anchors_common_git_dir ROOT -- the git directory that holds the shared
# config: ROOT/.git, or for a worktree the gitdir's commondir.
anchors_common_git_dir() {
  local root="$1" gitdir common
  if [[ -d "$root/.git" ]]; then
    anchors_canon_dir "$root/.git"
    return
  fi
  gitdir="$(sed -n 's/^gitdir:[[:space:]]*//p' "$root/.git" 2>/dev/null | head -n 1)"
  [[ -n "$gitdir" ]] || return 1
  gitdir="$(anchors_abspath "$gitdir" "$root")"
  if [[ -f "$gitdir/commondir" ]]; then
    common="$(head -n 1 "$gitdir/commondir")"
    gitdir="$(anchors_abspath "$common" "$gitdir")"
  fi
  anchors_canon_dir "$gitdir"
}

# anchors_repo_name GITDIR -- "owner/name" from the origin url, or empty.
# The owner is the second-to-last path segment, which covers SSH, HTTPS and
# proxy URLs alike.
anchors_repo_name() {
  local url
  url="$(awk '
    /^[[:space:]]*\[/ { in_origin = ($0 ~ /^[[:space:]]*\[remote "origin"\]/); next }
    in_origin && /^[[:space:]]*url[[:space:]]*=/ {
      sub(/^[^=]*=[[:space:]]*/, ""); sub(/[[:space:]]+$/, ""); print; exit
    }
  ' "$1/config" 2>/dev/null)"
  url="${url%/}"
  url="${url%.git}"
  url="${url//:/\/}"
  [[ "$url" == */*/* ]] || return 0
  local name="${url##*/}" rest="${url%/*}"
  printf '%s/%s' "${rest##*/}" "$name"
}

# anchors_owner_in_scope OWNER -- true when SA_ANCHORS_OWNERS lists OWNER
# (case-insensitive) or is "*". Unset means no repository is in scope.
anchors_owner_in_scope() {
  local owner entry
  owner="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  [[ -n "$owner" && -n "${SA_ANCHORS_OWNERS:-}" ]] || return 1
  IFS=',' read -ra entries <<< "$SA_ANCHORS_OWNERS"
  for entry in "${entries[@]}"; do
    entry="$(printf '%s' "$entry" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
    [[ "$entry" == "*" || "$entry" == "$owner" ]] && return 0
  done
  return 1
}

# anchors_marker_dir SESSION_KEY GITDIR -- this session's markers for a repo.
anchors_marker_dir() {
  local repo_key
  repo_key="$(printf '%s' "$2" | cksum)"
  repo_key="${repo_key%% *}"
  printf '%s/sa-anchors/%s/%s' "${TMPDIR:-/tmp}" "$1" "$repo_key"
}

# anchors_log EVENT REPO TOOL MISSING UNREAD -- append one evidence line,
# then send it to the optional OTLP sink. Hooks only ever append; no hook
# reads the log. Failures are ignored.
anchors_log() {
  local path="${SA_ANCHORS_LOG:-${XDG_STATE_HOME:-$HOME/.local/state}/software-architecture/anchors.log}"
  local fields=() field
  for field in "$1" "${2:--}" "${3:--}" "${4:--}" "${5:--}"; do
    fields+=("${field//[$'\t\r\n']/}")
  done
  if [[ "$path" != "off" ]]; then
    {
      mkdir -p "$(dirname "$path")" &&
        printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${fields[@]}" >> "$path"
    } 2>/dev/null || true
  fi
  anchors_otlp_send "${fields[@]}"
}

# anchors_json_string TEXT -- TEXT as a JSON string literal.
anchors_json_string() {
  local s="${1//[[:cntrl:]]/}"
  s="${s//\\/\\\\}"
  printf '"%s"' "${s//\"/\\\"}"
}

# anchors_otlp_send EVENT REPO TOOL MISSING UNREAD -- send one OTLP/HTTP JSON
# log record to $SA_ANCHORS_OTLP/v1/logs (issue #96). Unset or "off" sends
# nothing. The plugin names no endpoint and holds no credential: the endpoint,
# any headers ($SA_ANCHORS_OTLP_HEADERS, "Name=value,Name=value") and any
# proxy come from the environment. The send runs in one background curl with
# a 2-second budget, so it never delays or fails the hook. Attributes carry
# no prompt text and no local path.
anchors_otlp_send() {
  local base="${SA_ANCHORS_OTLP:-}"
  [[ -n "$base" && "$base" != "off" ]] || return 0
  command -v curl >/dev/null 2>&1 || return 0
  local owner="-" name="$2" attrs="" key value pair
  if [[ "$2" == */* ]]; then owner="${2%%/*}"; name="${2#*/}"; fi
  local keys=(event repo.owner repo.name tool missing unread)
  local values=("$1" "$owner" "$name" "$3" "$4" "$5")
  local i
  for i in "${!keys[@]}"; do
    attrs+="${attrs:+,}{\"key\":\"anchors.${keys[$i]}\",\"value\":{\"stringValue\":$(anchors_json_string "${values[$i]}")}}"
  done
  local body
  body="{\"resourceLogs\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"software-architecture\"}}]},\"scopeLogs\":[{\"scope\":{\"name\":\"software-architecture.anchors\"},\"logRecords\":[{\"timeUnixNano\":\"$(date -u +%s)000000000\",\"severityText\":\"INFO\",\"body\":{\"stringValue\":$(anchors_json_string "$1")},\"attributes\":[$attrs]}]}]}]}"
  # Headers go to curl on stdin (-H @-), so a credential never shows in ps.
  local headers="Content-Type: application/json" pairs=()
  IFS=',' read -ra pairs <<< "${SA_ANCHORS_OTLP_HEADERS:-}"
  for pair in ${pairs[@]+"${pairs[@]}"}; do
    key="${pair%%=*}"; value="${pair#*=}"
    key="${key//[[:space:]]/}"
    [[ -n "$key" && "$pair" == *=* ]] && headers+=$'\n'"$key: ${value//[$'\r\n']/}"
  done
  curl -sS -m 2 -o /dev/null -X POST -H @- --data-binary "$body" "${base%/}/v1/logs" \
    <<< "$headers" >/dev/null 2>&1 &
  return 0
}

# anchors_strip_null_redirects COMMAND -- COMMAND without redirects that write
# nothing: to /dev/null or to another descriptor.
anchors_strip_null_redirects() {
  if [[ "$1" == *">"* ]]; then
    printf '%s' "$1" | sed -E 's/[0-9&]?>>?[[:space:]]*\/dev\/null//g; s/[0-9]?>&[0-9-]+//g'
  else
    printf '%s' "$1"
  fi
}

# anchors_opted_out ROOT -- true when the repository opts out of all three hooks.
anchors_opted_out() {
  [[ -e "$1/.anchors-opt-out" ]]
}

# anchors_join SEPARATOR ITEM... -- the items joined by SEPARATOR.
anchors_join() {
  local IFS="$1"
  shift
  printf '%s' "$*"
}

# anchors_creator FILE -- the skill that creates a missing anchor.
anchors_creator() {
  case "$1" in
    STRATEGY.md) printf 'compound-engineering ce-strategy' ;;
    QUALITY.md) printf 'the qualitymd `quality` skill' ;;
    ARCHITECTURE.md) printf '/software-architecture:context' ;;
  esac
}
