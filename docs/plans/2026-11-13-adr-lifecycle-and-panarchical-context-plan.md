---
title: ADR Scope, Lifecycle and Panarchical Context - Plan
type: feat
date: 2026-11-13
execution: code
---

# ADR Scope, Lifecycle and Panarchical Context - Plan

## Goal Capsule

- **Objective:** ADRs record architectural decisions only, each ADR is carried
  through its lifecycle, a repository's ADRs are kept healthy as a set, and
  higher-level (enterprise, platform) ADRs reach every session in a configured
  order.
- **Means:** a scope test and lifecycle model in the
  `architecture-decision-records` skill; a PreToolUse hook that fires when an
  ADR file is written or edited, so the skill reaches the agent even when no
  prompt phrase matched; a `Context Sources` section in `ARCHITECTURE.md`,
  set by `/software-architecture:context`, that orders the ADR homes from the
  slowest, widest level to the fastest, narrowest; and a
  `/software-architecture:adr-audit` command for the portfolio review.
- **Authority:** ADR-0006 (this plugin). `STRATEGY.md` Boundaries constrain
  the mechanism: hooks are opt-out, warn and never block, keep no state across
  sessions, and hard-code no organization.
- **Stop conditions:** stop if a hook would deny a tool call, execute any part
  of its input, or name a specific organization or repository.

## Problem Frame

Two observations from the owner, checked against the repositories:

1. **ADRs are written for decisions that are not architectural.** The skill
   says "use whenever an architectural decision is being made" and "if you are
   not sure, lean toward writing it", but it never says what *architectural*
   means, and it lists no non-ADR homes. Examples in the enterprise ADR set
   read as an observed fact with an amendment (a DNS-hosting record) and as a
   client-behavior lesson (an MCP resource-template gotcha). Each has value,
   but as an ADR it adds noise to the decision set.
2. **The ADR skills do not trigger when an ADR is written.** Every ADR trigger
   is prompt language (Hook 2 regex, the skill description). A session that
   writes `docs/adr/NNNN-*.md` directly, for example during `ce-work`, an
   `lfg` run or an "offer an ADR after each decision" habit, gets only the
   placement reminder (Hook 9), which says nothing about ADR scope, lifecycle
   or higher-level ADRs. No hook fires on an Edit of an ADR (status changes,
   supersession).

A third gap: the routing table in `ARCHITECTURE.md` names where ADRs live, but
it gives no order to read them in, no binding-or-advisory status, and no
channel for a local decision that should change a higher-level one.

## Requirements

**Scope (what is, and is not, an ADR)**

- R1. The skill states an architectural-scope test: the decision changes the
  structure of the repository, the structure of the solution it holds, a
  quality attribute (architectural characteristic) trade-off, a technology
  selection, or a contract between parts or systems.
- R2. The skill lists the non-ADR kinds of record and the home for each:
  worklog, session log, plan, runbook, how-to, incident review, lesson or
  gotcha, observed fact or inventory, status update, convention without a
  trade-off, single-PR implementation choice.
- R3. An ADR is offered only when R1 holds and the three existing triggers
  hold (hard to reverse, surprising without context, a real trade-off). The
  "if not sure, lean toward writing it" default is removed.

**Triggering**

- R4. A Write or Edit of a file in an ADR directory adds context that names
  the skill, the scope test, the lifecycle checks for an Edit, and the higher
  levels to check, from `ARCHITECTURE.md` Context Sources, in their order.
- R5. A Bash command that runs `adr new` adds the same context.
- R6. The skill description names file-level triggers (writing or editing an
  ADR file, `adr new`, supersede, deprecate, ADR review) and names the
  non-ADR cases so the skill also triggers when the answer is "not an ADR".
- R7. The new hook replaces the ADR branch of the placement hook, and keeps
  the SAE-027 `Placement fit:` line in its message, so an ADR gets one
  reminder, not two.

**Lifecycle (one ADR)**

- R8. The skill defines the states Proposed, Accepted, Amended, Superseded,
  Deprecated, Rejected and Reclassified, the allowed transitions, and what
  each transition needs (back-links, date, revisit-trigger review, fitness
  function link).
- R9. An accepted ADR's Decision section is not rewritten. A change is an
  amendment (additive, linked) or a superseding ADR.

**Portfolio (all ADRs in one repository)**

- R10. `/software-architecture:adr-audit` checks each ADR against the scope
  test, the lifecycle rules and the higher-level ADRs, and reports: candidates
  to reclassify, stale Proposed records, broken supersession links, Accepted
  records with no revisit triggers, conflicts with a binding higher level, and
  revolt candidates (see R13).
- R11. The audit never moves, edits or deletes an ADR. It proposes; the user
  decides.

**Higher-level ADRs and panarchical context**

- R12. `ARCHITECTURE.md` can hold a `## Context Sources` table, one row per ADR
  home, in load order from the slowest, widest level to the fastest,
  narrowest, with columns Order, Level, Source, ADR path, Prefix, Mode
  (`binding` or `advisory`) and Revolt channel.
- R13. *Remember* (top-down): before a new ADR, the agent reads the binding
  sources in order and cites each constraining ADR in a `Constrained by:` line.
  *Revolt* (bottom-up): a local ADR that departs from, or pioneers past, a
  binding higher-level ADR states `Deviates from:` and the agent offers an
  upstream proposal through the source's revolt channel.
- R14. `/software-architecture:context` asks for the Context Sources, their
  order, mode and revolt channel, and writes the table.
- R15. The `adr-historian` agent searches in Context Sources order when the
  table exists, and falls back to the routing table.

## Key Technical Decisions

- KTD1. **Markdown table, not YAML.** Hooks are bash with `jq`; a fixed-column
  table under a fixed heading parses with `awk` and stays readable. It keeps
  configuration in `ARCHITECTURE.md`, which the Boundaries name as the
  configuration surface.
- KTD2. **One hook file, two events.** `adr-pretooluse.sh` matches
  `Write|Edit|Bash` and filters inside, like `anchors-gate.sh`.
- KTD3. **ADR directory detection.** A path matches when it is under the
  directory named in `.adr-dir` at the repository root, or under any
  `docs/adr/` or `docs/decisions/`, and ends in `.md`. Index files
  (`README.md`, `index.md`) are skipped.
- KTD4. **No state.** The hook re-reads `ARCHITECTURE.md` on each call; a
  session writes few ADRs.

## Units

- U1. ADR-0006 recording the decision. (R1 to R15)
- U2. `adr-pretooluse.sh` + tests, test-first; placement hook drops the ADR
  branch; `hooks.json`, README hook tables. (R4, R5, R7)
- U3. Skill rewrite with references `scope.md`, `lifecycle.md`,
  `portfolio.md`, `panarchical-context.md`. (R1 to R3, R6, R8, R9, R12, R13)
- U4. `/software-architecture:adr-audit` command. (R10, R11)
- U5. `/software-architecture:context` and `architecture-governance-levels`
  template gain Context Sources; `adr-historian` reads them. (R12, R14, R15)
- U6. Prompt and Stop hook text: ADR-lifecycle phrases, and "architectural
  decisions only, not worklogs". (R3, R6)
- U7. `docs/scenarios/adr-lifecycle.feature`. (all)

## Out of scope

- Moving or reclassifying existing ADRs in any repository. The audit reports;
  the owner decides per ADR.
- A CI fitness function for ADR scope. Scope is a judgment; a later fitness
  function can check the mechanical parts (status line present, supersession
  back-links).
- Fetching remote Context Sources over the network in a hook. The hook names
  the sources; the agent reads them.
