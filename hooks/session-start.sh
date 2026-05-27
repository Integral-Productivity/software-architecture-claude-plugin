#!/usr/bin/env bash
#
# Hook 1: SessionStart — ADR/radar orientation
#
# Emits a compact reminder about the repo's ADR state and radar status.
# Replaces the manual "did I check ADRs?" mental discipline.
#
# Opt-out: set SA_PLUGIN_HOOKS to a comma-separated list of enabled hooks.
# If "session" is not in the list, this hook exits silently.
# Default (env unset) = all enabled.

set -euo pipefail

# Opt-out check
if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",session,"* ]]; then
    exit 0
  fi
fi

# Run from a git repo only — silently exit otherwise
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
HAS_SRC=false
HAS_ADR_DIR=false
ADR_COUNT=0
LATEST_ADRS=""

if [[ -d "$REPO_ROOT/src" || -d "$REPO_ROOT/app" || -d "$REPO_ROOT/lib" ]]; then
  HAS_SRC=true
fi

if [[ -f "$REPO_ROOT/.adr-dir" ]]; then
  HAS_ADR_DIR=true
  ADR_PATH="$REPO_ROOT/$(cat "$REPO_ROOT/.adr-dir")"
  if [[ -d "$ADR_PATH" ]]; then
    ADR_COUNT=$(find "$ADR_PATH" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
    LATEST_ADRS=$(find "$ADR_PATH" -maxdepth 1 -name "*.md" -type f 2>/dev/null \
      | sort -r \
      | head -3 \
      | xargs -I{} basename {} .md 2>/dev/null \
      | tr '\n' '|' \
      | sed 's/|$//' \
      | sed 's/|/, /g')
  fi
fi

# Radar awareness
RADAR_PATH="$HOME/GitHub/software-architecture-excellence/docs/tech-context/radar.md"
HAS_RADAR=false
if [[ -f "$RADAR_PATH" ]]; then
  HAS_RADAR=true
fi

# Compose the reminder
MESSAGE=""

if [[ "$HAS_SRC" == "true" && "$HAS_ADR_DIR" == "false" ]]; then
  MESSAGE+="📐 No .adr-dir found in this repo. To begin architectural decision capture, offer the user: \`adr init docs/adr\`. See \`software-architecture:architecture-decision-records\`."
elif [[ "$HAS_ADR_DIR" == "true" ]]; then
  MESSAGE+="📐 Repo has ${ADR_COUNT} ADRs."
  if [[ -n "$LATEST_ADRS" ]]; then
    MESSAGE+=" Latest: ${LATEST_ADRS}."
  fi
  MESSAGE+=" Use \`software-architecture:adr-historian\` agent to search prior decisions before making new ones."
fi

if [[ "$HAS_RADAR" == "true" ]]; then
  if [[ -n "$MESSAGE" ]]; then
    MESSAGE+=" "
  fi
  MESSAGE+="📊 IP Technology Radar available at ${RADAR_PATH}."
fi

# Emit nothing if nothing to say
if [[ -z "$MESSAGE" ]]; then
  exit 0
fi

# Emit as Claude Code hook JSON
jq -n --arg msg "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $msg
  }
}'
