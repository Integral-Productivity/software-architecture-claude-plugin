#!/usr/bin/env bash
#
# Hook 3: PreToolUse (Write/Edit on dependency files) — radar enforcement
#
# When a tool call would modify package.json, pnpm-lock.yaml,
# requirements.txt, go.mod, Cargo.toml, etc., diff added dependencies
# against the org's custom Technology Radar.
#
# Hold ring → emit warning system reminder requesting user confirmation.
# Trial ring → emit trial-conditions reminder.
# Unknown → suggest /software-architecture:radar.
# Adopt → silent (no reminder).
#
# Reads the radar at runtime from the path in the SA_RADAR_PATH env var.
# Degrades gracefully if unset or the file is absent.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "deps".

set -euo pipefail

if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",deps,"* ]]; then
    exit 0
  fi
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')"

# Only fire on Write/Edit
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

# Only fire on dependency files
DEP_FILE=false
case "$(basename "$FILE_PATH")" in
  package.json|pnpm-lock.yaml|package-lock.json|yarn.lock|requirements.txt|requirements-*.txt|Pipfile|pyproject.toml|go.mod|go.sum|Cargo.toml|Cargo.lock|Gemfile|Gemfile.lock)
    DEP_FILE=true
    ;;
esac

if [[ "$DEP_FILE" == "false" ]]; then
  exit 0
fi

# Locate radar via the SA_RADAR_PATH env var (point it at your radar
# markdown file). If unset, this hook stays silent — no radar, no enforcement.
RADAR_PATH="${SA_RADAR_PATH:-}"
if [[ -z "$RADAR_PATH" ]]; then
  exit 0
fi
if [[ ! -f "$RADAR_PATH" ]]; then
  jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "additionalContext": "📊 Dependency file edit detected, but the Technology Radar configured in SA_RADAR_PATH was not found. Cannot enforce ring policy."
    }
  }'
  exit 0
fi

# Extract the new content (Write) or new_string (Edit)
NEW_CONTENT="$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')"
if [[ -z "$NEW_CONTENT" ]]; then
  exit 0
fi

# Build a list of candidate technology names mentioned in the new content.
# Naive: extract quoted package names. Catches obvious npm-style deps.
#
# A quoted token followed by `:` and an opening brace or bracket is manifest
# structure, not a technology: `"dependencies": {` names the container that
# holds packages, while `"lodash": "^4"` names one of them. Dropping container
# keys keeps `dependencies` and its siblings out of both the radar lookup and
# the message. Deriving them from the content beats a hardcoded denylist --
# a denylist would also silence a real package that happens to share a name
# with a manifest key, which is the same silent under-enforcement this hook
# exists to prevent.
#
# `|| true` on each grep: finding nothing is an empty result, not a failure,
# and under `set -o pipefail` a non-matching grep would otherwise abort the
# hook with exit 1 instead of the contracted silent exit 0.
CONTAINER_KEYS="$(echo "$NEW_CONTENT" \
  | grep -oE '"[a-z@][a-z0-9@/_-]+"[[:space:]]*:[[:space:]]*[{[]' \
  | tr -d '"' \
  | sed 's/[[:space:]]*:.*$//' \
  | sort -u || true)"

CANDIDATES="$(echo "$NEW_CONTENT" \
  | grep -oE '"[a-z@][a-z0-9@/_-]+"' \
  | tr -d '"' \
  | sort -u || true)"

if [[ -n "$CANDIDATES" && -n "$CONTAINER_KEYS" ]]; then
  CANDIDATES="$(printf '%s\n' "$CANDIDATES" | grep -vxF "$CONTAINER_KEYS" || true)"
fi

# Cap after filtering, so the limit counts technologies rather than structure.
CANDIDATES="$(printf '%s' "$CANDIDATES" | head -50)"

if [[ -z "$CANDIDATES" ]]; then
  exit 0
fi

# Check each candidate against the radar
HOLDS=""
TRIALS=""
UNKNOWNS=""

for CAND in $CANDIDATES; do
  # Skip obviously non-tech tokens
  if [[ "${#CAND}" -lt 3 ]]; then continue; fi

  # Resolve the candidate's ring.
  #
  # Portability: `\b` (word boundary) and `IGNORECASE` are gawk extensions.
  # The awk shipped with macOS reads `\b` as a backspace escape and treats
  # IGNORECASE as an inert variable, so a pattern built from them matches
  # nothing at all. Lowercase both sides with tolower() and compare whole
  # space-delimited tokens instead — POSIX awk everywhere.
  #
  # Scope: only the row's first `|`-delimited cell (Technology) can resolve
  # a ring. Notes-column prose names other rings' technologies on purpose
  # ("do not introduce Jest" sits in an Adopt row), so matching the whole
  # line would classify Hold technologies as Adopt.
  #
  # Redirect, do not pipe: awk exits at the first match, so a piped writer
  # would take SIGPIPE once the radar exceeds the pipe buffer, and
  # `pipefail` would abort the whole hook with exit 141 and no output --
  # silently dropping the warning on exactly the large radars that need it.
  RING="$(awk -v cand="$CAND" '
    BEGIN { cand = " " tolower(cand) " " }
    /^##[[:space:]]/ {
      section = ""
      if ($2 == "Adopt" || $2 == "Trial" || $2 == "Assess" || $2 == "Hold") section = $2
      next
    }
    section == "" { next }
    /^[[:space:]]*\|/ {
      split($0, cells, "\\|")
      tech = tolower(cells[2])
      gsub("[^a-z0-9@/:._-]+", " ", tech)
      if (index(" " tech " ", cand) > 0) { print section; exit }
    }
  ' < "$RADAR_PATH")"

  case "$RING" in
    Hold)   HOLDS+="${CAND}, " ;;
    Trial)  TRIALS+="${CAND}, " ;;
    Adopt|Assess) : ;;  # silent or implicit
    *)      UNKNOWNS+="${CAND}, " ;;
  esac
done

# Trim trailing comma-space
HOLDS="${HOLDS%, }"
TRIALS="${TRIALS%, }"
UNKNOWNS="${UNKNOWNS%, }"

MESSAGE=""

if [[ -n "$HOLDS" ]]; then
  MESSAGE+="🟥 **Hold-ring dependencies detected**: ${HOLDS}. The Technology Radar places these on **Hold**. Confirm with the user before proceeding, and consider filing a justification ADR if added intentionally. "
fi

if [[ -n "$TRIALS" ]]; then
  MESSAGE+="🟨 **Trial-ring dependencies**: ${TRIALS}. The Technology Radar places these on Trial. Note the trial conditions in any ADR. "
fi

if [[ -n "$UNKNOWNS" && -z "$HOLDS" && -z "$TRIALS" ]]; then
  # Only mention unknowns if no Hold/Trial; otherwise it's noise
  MESSAGE+="📊 New dependencies (${UNKNOWNS}) not on the Radar. Consider \`/software-architecture:radar\` to assess. "
fi

if [[ -z "$MESSAGE" ]]; then
  exit 0
fi

jq -n --arg msg "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": $msg
  }
}'
