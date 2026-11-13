---
name: adr-audit
description: Review a repository's ADRs as one portfolio. Checks each ADR against the scope test, the lifecycle rules and the binding higher-level ADRs from ARCHITECTURE.md Context Sources, and proposes reclassifications, link fixes and upstream (revolt) proposals. Read-only; it never edits an ADR.
---

# /software-architecture:adr-audit

Review the ADR set of the current repository, using
`software-architecture:architecture-decision-records` and its
`references/portfolio.md`.

## Process

1. **Find the ADRs.** Use `.adr-dir` at the repository root, else
   `docs/adr/`. List every ADR with number, title, status and date.
2. **Load the higher levels.** Read the `## Context Sources` table in
   `ARCHITECTURE.md`. Dispatch the `software-architecture:adr-historian`
   agent to list the binding ADRs in that order. A source it cannot reach is
   reported as "not searched".
3. **Run the checks** in `references/portfolio.md`: scope, stale proposal,
   broken supersession, missing or fired revisit triggers, duplicate,
   mis-routed, remember gap, conflict, revolt candidate, fitness link.
4. **Report** one table, most severe first:

   | ADR | Check | Finding | Evidence | Proposed action |
   |---|---|---|---|---|

   Then a one-line count: ADRs reviewed, findings by check, sources not
   searched.
5. **Offer, do not act.** For each proposed action, offer to do it on a
   `claude/<slug>` branch. Reclassify, supersede and upstream proposals each
   need the user's yes. Never delete or renumber an ADR.

## Arguments

Optional path to the ADR directory. Defaults to `.adr-dir`, then `docs/adr/`.

## See Also

- `/software-architecture:decide` — write one new ADR.
- `/software-architecture:context` — configure the Context Sources this
  audit reads.
- `/software-architecture:review` — review a diff against ADRs.
