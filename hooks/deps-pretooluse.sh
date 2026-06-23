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
CANDIDATES=$(echo "$NEW_CONTENT" \
  | grep -oE '"[a-z@][a-z0-9@/_-]+"' \
  | tr -d '"' \
  | sort -u \
  | head -50)

if [[ -z "$CANDIDATES" ]]; then
  exit 0
fi

# Check each candidate against the radar
HOLDS=""
TRIALS=""
UNKNOWNS=""

# Read full radar once
RADAR_TEXT="$(cat "$RADAR_PATH")"

for CAND in $CANDIDATES; do
  # Skip obviously non-tech tokens
  if [[ "${#CAND}" -lt 3 ]]; then continue; fi

  # Search in radar — case-insensitive
  RING=""
  if echo "$RADAR_TEXT" | grep -qiE "^\| [^|]*\b$(echo "$CAND" | sed 's/[][\.*^$()+?{}|]/\\&/g')\b" ; then
    # Find which section this is in
    SECTION=$(echo "$RADAR_TEXT" \
      | awk -v cand="$(echo "$CAND" | sed 's/[][\.*^$()+?{}|]/\\&/g')" \
        'BEGIN{IGNORECASE=1} /^## (Adopt|Trial|Assess|Hold)/{section=$2} $0 ~ "\\b"cand"\\b"{print section; exit}')
    RING="$SECTION"
  fi

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
