---
name: trade-off
description: Apply Hard Parts trade-off analysis to an architectural decision without committing to an ADR. Useful for thinking through a decision before recording it.
---

# /software-architecture:trade-off

Run a Hard Parts trade-off analysis on a proposed decision. Surfaces the
relevant archetype and walks through the integrator/disintegrator scoring
without writing an ADR.

## Process

1. **Frame the decision** — forced single-sentence choice.

2. **Identify the archetype** — match to one of:
   - Granularity
   - Coupling and cohesion
   - Data ownership
   - Sagas and orchestration
   - Contracts and evolution

   If none match cleanly, fall back to general trade-off reasoning from
   `software-architecture:architectural-trade-offs`.

3. **Load archetype file** — read the relevant
   `architectural-trade-offs/decision-archetypes/*.md` and present the
   trade-off table to the user.

4. **Score forces** — work with the user to score each integrator and
   disintegrator on a 1–5 scale for the specific situation.

5. **Surface implications** — what does each direction make easier?
   harder? Name the cost.

6. **Stop short of ADR** — report the result. Offer to chain into
   `/software-architecture:decide` if the user wants to capture as an ADR.

## When NOT to Use This Command

If the user has already decided and just wants to record it, use
`/software-architecture:decide` instead — that command incorporates this
analysis and writes the ADR in one flow.

## Arguments

If invoked with `$ARGUMENTS`, treat as the decision question.
