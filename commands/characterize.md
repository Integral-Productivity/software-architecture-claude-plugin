---
name: characterize
description: Workshop architectural characteristics for a new system or feature. Walks through stakeholder elicitation, business-goal-to-ility translation, prioritization, and measurement definition.
---

# /software-architecture:characterize

Run a focused architectural-characteristics workshop. Output: the top
3–7 characteristics for the system, with rationale, conflict
acknowledgements, and candidate fitness functions.

## Process

1. **Frame the scope** — what system or feature is being characterized?
   New system, new module, or evaluating an existing one?

2. **Elicit business goals** — ask the user (or stakeholder) what
   business outcomes the system must deliver. Convert each to candidate
   characteristics using the goal-to-ility table from
   `software-architecture:architectural-characteristics`.

3. **Listen for implicit characteristics** — scan the conversation for
   phrases like "must be fast", "can't go down", "easy to extend" and
   convert each into a candidate.

4. **Force prioritization** — present the candidates and force the
   selection of 3 firm + 4 soft (max 7 total). Highlight conflict pairs
   (e.g., performance ↔ security; CAP trade-offs).

5. **Define measurements** — for each selected characteristic, name the
   measurement (e.g., "p99 < 200ms", "99.9% uptime", "new integration <
   200 LOC"). Without a measurement, the characteristic isn't chosen.

6. **Scaffold fitness functions** — for each measurable characteristic,
   offer to invoke `/software-architecture:fitness` to author the
   corresponding check.

7. **Write an ADR** — the prioritization itself is an architectural
   decision. Offer to invoke `/software-architecture:decide` to capture it
   at the appropriate level (usually System).

## Output Artifacts

The command produces:
- A markdown summary of the chosen characteristics
- A list of candidate fitness functions (one per characteristic)
- A draft ADR (if the user opts to capture)

## Arguments

If invoked with `$ARGUMENTS`, treat as the system/feature name.
