#!/usr/bin/env bash
#
# Shared helpers for the governing-document anchor hooks (ADR-0005):
# anchors-read.sh, anchors-gate.sh and anchors-reminder.sh source this file.
#
# "Anchors" are STRATEGY.md, QUALITY.md and ARCHITECTURE.md at a repository
# root. Everything here reads files only: no git process, no network, and no
# input is ever evaluated as code.

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
  repo_key="$(printf '%s' "$2" | cksum | awk '{ print $1 }')"
  printf '%s/sa-anchors/%s/%s' "${TMPDIR:-/tmp}" "$1" "$repo_key"
}

# anchors_log EVENT REPO TOOL MISSING UNREAD -- append one evidence line.
# Hooks only ever append; no hook reads the log. Failures are ignored.
anchors_log() {
  local path="${SA_ANCHORS_LOG:-${XDG_STATE_HOME:-$HOME/.local/state}/software-architecture/anchors.log}"
  [[ "$path" == "off" ]] && return 0
  local fields=() field
  for field in "$1" "${2:--}" "${3:--}" "${4:--}" "${5:--}"; do
    fields+=("$(printf '%s' "$field" | tr -d '\t\r\n')")
  done
  {
    mkdir -p "$(dirname "$path")" &&
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${fields[@]}" >> "$path"
  } 2>/dev/null || true
}

# anchors_creator FILE -- the skill that creates a missing anchor.
anchors_creator() {
  case "$1" in
    STRATEGY.md) printf 'compound-engineering ce-strategy' ;;
    QUALITY.md) printf 'the qualitymd `quality` skill' ;;
    ARCHITECTURE.md) printf '/software-architecture:context' ;;
  esac
}
