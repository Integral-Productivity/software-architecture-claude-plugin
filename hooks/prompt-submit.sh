#!/usr/bin/env bash
#
# Hook 2: UserPromptSubmit — architectural decision-language detector
#
# Scans the user's prompt for high-signal architectural-decision phrases.
# When matched, injects a system reminder pointing at /software-architecture:decide
# and the adr-historian agent.
#
# No user-visible output. Purely a system-reminder for Claude.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "prompt".

set -euo pipefail

if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",prompt,"* ]]; then
    exit 0
  fi
fi

# Hook input arrives on stdin as JSON
INPUT="$(cat)"
PROMPT="$(echo "$INPUT" | jq -r '.prompt // empty')"

if [[ -z "$PROMPT" ]]; then
  exit 0
fi

# Lower-case for matching
PROMPT_LOWER="$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')"

# Architectural decision-language regex set
MATCH=false

# "we should X" / "let's X" with action verbs
if echo "$PROMPT_LOWER" | grep -qE "(we should|let's|let us) (use|adopt|switch|move|migrate|introduce|replace|deprecate|kill|split|merge|extract|consolidate|refactor|rewrite)" ; then
  MATCH=true
fi

# "moving from X to Y" / "switching to X" / "thinking about adopting X"
if echo "$PROMPT_LOWER" | grep -qE "(moving (from|to)|switching (from|to)|thinking about (using|adopting|switching to))" ; then
  MATCH=true
fi

# Hard Parts vocabulary triggers
if echo "$PROMPT_LOWER" | grep -qE "(saga|event sourcing|cqrs|microservice|monolith|split this service|extract this|service boundary|bounded context|distributed transaction|orchestrat|choreograph)" ; then
  MATCH=true
fi

# Schema/contract evolution triggers
if echo "$PROMPT_LOWER" | grep -qE "(breaking change|api version|schema migration|contract change)" ; then
  MATCH=true
fi

# ADR lifecycle triggers: writing, superseding, deprecating or reviewing ADRs
ADR_MATCH=false
if echo "$PROMPT_LOWER" | grep -qE "((^|[^a-z])adrs?([^a-z]|$)|decision record|supersed|deprecate (the|this|that) (adr|decision)|record (this|the|that) decision|document (why|the decision))" ; then
  MATCH=true
  ADR_MATCH=true
fi

if [[ "$MATCH" == "false" ]]; then
  exit 0
fi

# Emit system reminder
REMINDER="💡 The user's prompt suggests an architectural decision. Before proceeding, consider:
- Invoking the \`adr-historian\` agent to check for prior decisions.
- Using \`/software-architecture:decide\` to walk through Hard Parts trade-offs and capture as an ADR.
- Using \`/software-architecture:trade-off\` to reason through the decision without committing to an ADR yet.
- Writing an ADR only if it passes the scope test in \`software-architecture:architecture-decision-records\` (architectural scope, hard to reverse, surprising, a real trade-off); worklogs, plans, lessons and facts go elsewhere."

if [[ "$ADR_MATCH" == "true" ]]; then
  REMINDER+="
- For ADR changes (supersede, amend, deprecate, review), follow the lifecycle in that skill, or run \`/software-architecture:adr-audit\` for the whole set."
fi

jq -n --arg msg "$REMINDER" '{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $msg
  }
}'
