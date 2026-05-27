---
name: decide
description: Guided ADR creation. Dispatches adr-historian for prior context, applies Hard Parts trade-off framework if relevant, then writes the ADR at the correct level per the routing table.
---

# /software-architecture:decide

Walk through an architectural decision end-to-end: prior context →
trade-off analysis → ADR.

## Process

1. **Frame the decision** — restate the user's intent as a forced
   single-sentence choice. If it's not a forced choice, ask the user to
   refine. (See `software-architecture:architectural-trade-offs` for the
   forced-choice discipline.)

2. **Dispatch `adr-historian`** — search prior ADRs across the user's
   `~/.claude/CLAUDE.md` routing table (Enterprise, Platform, System,
   Service repos) for decisions relevant to the current one. Surface any
   prior decisions that constrain or contradict the current direction.

3. **Determine archetype** — if the decision matches a Hard Parts
   archetype (granularity, coupling, data ownership, sagas, contracts),
   load the archetype file from `architectural-trade-offs/decision-archetypes/`
   and walk the user through the trade-off table.

4. **Determine target repo** — using
   `software-architecture:architecture-governance-levels`, identify
   which repo's `docs/adr/` is the correct home for the ADR.

5. **Run technology check (if applicable)** — if the decision involves
   selecting a technology, invoke `software-architecture:technology-radar`
   to surface ring placements and add them to the options table.

6. **Write the ADR** — use `adr new <Title>` if `.adr-dir` exists; else
   offer to initialize. Follow the six-section anatomy from
   `software-architecture:architecture-decision-records`.

7. **Confirm before commit** — show the ADR draft to the user; only
   commit after explicit confirmation (per global CLAUDE.md "Executing
   actions with care").

## Branching

Use the `claude/<slug>` branch convention per global CLAUDE.md.

## Arguments

If invoked with `$ARGUMENTS`, treat as the proposed decision title.
Otherwise, ask the user for it.

## See Also

- `software-architecture:trade-off` — run the trade-off analysis WITHOUT
  committing to an ADR.
- `software-architecture:review` — review an existing diff against ADRs.
