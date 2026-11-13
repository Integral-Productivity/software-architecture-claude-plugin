#!/usr/bin/env bash
#
# Hook 10: PreToolUse (Write, Edit, Bash) — ADR file trigger
#
# When a session writes or edits an ADR file, or runs `adr new`, this hook
# puts the ADR practice in front of the agent at that moment (ADR-0006):
#   - a new ADR: the scope test, the higher-level ADR sources to remember, in
#     their configured order, and the `Placement fit:` line (SAE-027);
#   - an edit: the lifecycle rules (never rewrite an accepted Decision,
#     two-way supersession links).
# It adds context only; it never denies a tool call.
#
# Higher-level sources come from the `## Context Sources` table in the
# repository's ARCHITECTURE.md. The table is data: it is only parsed by awk
# and printed through `jq --arg`, never executed.
#
# Opt-out: SA_PLUGIN_HOOKS not containing "adr".

set -euo pipefail

if [[ -n "${SA_PLUGIN_HOOKS:-}" ]]; then
  if ! [[ ",$SA_PLUGIN_HOOKS," == *",adr,"* ]]; then
    exit 0
  fi
fi

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(jq -r '.tool_name // empty' <<<"$INPUT" 2>/dev/null || true)"
CWD="$(jq -r '.cwd // empty' <<<"$INPUT" 2>/dev/null || true)"
CWD="${CWD:-$PWD}"

# Walk up from a directory to the first ancestor holding `.git`.
# Prints nothing when there is none. Pure path handling: nothing is executed.
find_root() {
  local dir="$1"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -e "$dir/.git" ]]; then
      printf '%s' "$dir"
      return 0
    fi
    dir="${dir%/*}"
  done
  return 0
}

MODE=""       # new | edit
TARGET=""     # file path, or "adr new" for the CLI
ROOT=""

case "$TOOL_NAME" in
  Write|Edit|MultiEdit)
    FILE_PATH="$(jq -r '.tool_input.file_path // empty' <<<"$INPUT" 2>/dev/null || true)"
    [[ -z "$FILE_PATH" ]] && exit 0
    if [[ "$FILE_PATH" != /* ]]; then
      FILE_PATH="$CWD/$FILE_PATH"
    fi
    [[ "$FILE_PATH" == *.md ]] || exit 0
    BASE="${FILE_PATH##*/}"
    BASE_LOWER="$(tr '[:upper:]' '[:lower:]' <<<"$BASE")"
    case "$BASE_LOWER" in
      readme.md|index.md|template.md|0000-template.md|toc.md) exit 0 ;;
    esac
    ROOT="$(find_root "${FILE_PATH%/*}")"

    IS_ADR=false
    if [[ "$FILE_PATH" =~ /docs/(adr|adrs|decisions)/ ]]; then
      IS_ADR=true
    elif [[ -n "$ROOT" && -f "$ROOT/.adr-dir" ]]; then
      ADR_DIR="$(head -n1 "$ROOT/.adr-dir" | tr -d '\r')"
      ADR_DIR="${ADR_DIR%/}"
      if [[ -n "$ADR_DIR" && "$FILE_PATH" == "$ROOT/$ADR_DIR/"* ]]; then
        IS_ADR=true
      fi
    fi
    [[ "$IS_ADR" == "true" ]] || exit 0

    TARGET="$FILE_PATH"
    if [[ "$TOOL_NAME" == "Write" && ! -e "$FILE_PATH" ]]; then
      MODE="new"
    else
      MODE="edit"
    fi
    ;;
  Bash)
    COMMAND="$(jq -r '.tool_input.command // empty' <<<"$INPUT" 2>/dev/null || true)"
    ADR_NEW_RE='(^|[;&|(])[[:space:]]*adr[[:space:]]+new([[:space:]]|$)'
    if [[ "$COMMAND" =~ $ADR_NEW_RE ]]; then
      MODE="new"
      TARGET="adr new"
      ROOT="$(find_root "$CWD")"
    else
      exit 0
    fi
    ;;
  *)
    exit 0
    ;;
esac

# Context Sources: rows of the table under `## Context Sources`, in file order.
# Columns: Order | Level | Source | ADR path | Prefix | Mode | Revolt channel
SOURCES=""
if [[ -n "$ROOT" && -f "$ROOT/ARCHITECTURE.md" ]]; then
  SOURCES="$(awk -F'|' '
    /^##[[:space:]]+Context Sources[[:space:]]*$/ { inside = 1; next }
    inside && /^##[[:space:]]/ { inside = 0 }
    inside && /^[[:space:]]*\|/ {
      rows++
      if (rows <= 2) next            # header and separator
      for (i = 2; i <= 8; i++) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $i); gsub(/`/, "", $i) }
      if ($3 == "" && $4 == "") next
      line = "  " $2 ". " $3 ": " $4
      if ($5 != "") line = line " (" $5 ")"
      if ($7 != "") line = line ", " $7
      if ($8 != "" && $8 != "-" && $8 != "—") line = line ", revolt via " $8
      print substr(line, 1, 240)
      if (++printed >= 8) exit
    }
  ' "$ROOT/ARCHITECTURE.md")"
fi

# Radar Sources: rows of the table under `## Radar Sources`.
# Columns: Order | Radar | Location | Kind | Mode
RADARS=""
if [[ -n "$ROOT" && -f "$ROOT/ARCHITECTURE.md" ]]; then
  RADARS="$(awk -F'|' '
    /^##[[:space:]]+Radar Sources[[:space:]]*$/ { inside = 1; next }
    inside && /^##[[:space:]]/ { inside = 0 }
    inside && /^[[:space:]]*\|/ {
      rows++
      if (rows <= 2) next
      for (i = 2; i <= 6; i++) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $i); gsub(/`/, "", $i) }
      if ($3 == "" && $4 == "") next
      line = "  " $2 ". " $3 ": " $4
      if ($5 != "") line = line " (" $5
      if ($6 != "") line = line ", " $6
      if ($5 != "") line = line ")"
      print substr(line, 1, 240)
      if (++printed >= 6) exit
    }
  ' "$ROOT/ARCHITECTURE.md")"
fi
if [[ -n "$RADARS" ]]; then
  RADAR_NOTE="If this ADR adopts a technology, draft it from these radars, in order (\`/software-architecture:adopt\`, references/technology-adoption.md): look up every option, add a Radar evidence section, and let the org ring shape the ADR:
${RADARS}"
elif [[ -n "${SA_RADAR_PATH:-}" ]]; then
  RADAR_NOTE="If this ADR adopts a technology, draft it from the radar at SA_RADAR_PATH and Thoughtworks (\`/software-architecture:adopt\`, references/technology-adoption.md)."
else
  RADAR_NOTE="If this ADR adopts a technology, draft it with \`/software-architecture:adopt\`: no radar is configured, so check Thoughtworks and offer \`/software-architecture:context\` to add a Radar Sources table."
fi

if [[ -n "$SOURCES" ]]; then
  REMEMBER="Remember (top-down): before you decide, read the binding sources below in this order, slowest and widest level first, and cite each ADR that constrains this one on a \`Constrained by:\` line:
${SOURCES}
Revolt (bottom-up): if this ADR departs from or goes past a binding higher-level ADR, say so on a \`Deviates from:\` line and offer the user an upstream proposal through that source's revolt channel."
else
  REMEMBER="No \`## Context Sources\` table in ARCHITECTURE.md, so the higher-level ADRs (enterprise, platform) are not configured for this repository. Search them with the \`software-architecture:adr-historian\` agent, and offer the user \`/software-architecture:context\` to configure them in order."
fi

if [[ "$MODE" == "new" ]]; then
  MESSAGE="📝 **ADR file**: \`${TARGET}\` creates an Architecture Decision Record. Load \`software-architecture:architecture-decision-records\` before you write it.
1. Scope test: an ADR records a decision that changes the repository's structure, the solution's structure, a quality-attribute trade-off, a technology selection, or a contract between parts or systems, AND is hard to reverse, surprising without context, and a real trade-off. A worklog, plan, runbook, how-to, lesson, observed fact, status update or one-PR implementation choice is not an ADR: put it in its own home (see the skill's references/scope.md) and do not create this file.
2. Route it: confirm the governance level (\`software-architecture:architecture-governance-levels\`) and state a \`Placement fit: <Strong|Weak|Misfit> — <reason>\` line in the commit message.
3. ${REMEMBER}
4. ${RADAR_NOTE}
5. Keep feature detail (commands, fields, user steps, acceptance criteria) out of the Decision: it belongs in a PRD, specification or issue, linked from the ADR.
6. Name the tracked work item on a \`Provenance:\` line (GitHub issue, Productboard entity or GlassFrog project ID); without one the ADR stays Proposed. The lifecycle fitness function (ADR-0009) fails CI on an Accepted ADR whose gaps outlast the curing period.
7. Start it as Proposed, and run the \`software-architecture:adr-reviewer\` agent on the draft before you commit it."
else
  MESSAGE="📝 **ADR edit**: \`${TARGET}\` is an Architecture Decision Record. Apply the lifecycle rules of \`software-architecture:architecture-decision-records\` (references/lifecycle.md):
- Do not rewrite the Decision of an Accepted ADR. Add a dated amendment, or write a superseding ADR.
- A status change needs its date and links: Superseded names its successor and the successor links back; Deprecated and Rejected give the reason; Reclassified names the record's new home.
- When the decision changes, review its revisit triggers and any fitness function that cites it.
${REMEMBER}"
fi

jq -n --arg msg "$MESSAGE" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": $msg
  }
}'
