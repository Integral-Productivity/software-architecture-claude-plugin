---
name: adopt
description: Draft a technology-adoption ADR from the configured radars. Looks up each option on every radar in ARCHITECTURE.md Radar Sources (org radar file or service, Thoughtworks), lets the org ring shape the ADR (Trial conditions, Hold deviation), and offers the matching radar ring proposal.
---

# /software-architecture:adopt

Draft an ADR for adopting a technology, grounded in the available radars.
Follow `software-architecture:architecture-decision-records`
`references/technology-adoption.md`.

## Process

1. **Name the technology and the options.** Ask for the alternatives that
   were considered if the user names only one.
2. **Scope test.** Apply both gates. If the choice is reversible in one PR,
   say so, record it in the PR body, and stop.
3. **Find the radars.** Read `## Radar Sources` in `ARCHITECTURE.md`; else
   fall back as the reference says. Report any radar not checked.
4. **Look up every option on every radar** with
   `software-architecture:technology-radar`.
5. **Remember.** Dispatch `software-architecture:adr-historian` for prior
   ADRs about the technology or its category, in Context Sources order.
6. **Draft the ADR** at the right governance level, with the Radar evidence
   section, the radar row in the options table, the ring-specific additions
   (Trial conditions, Hold deviation), and radar revisit triggers. Status
   Proposed.
7. **Offer the radar proposal.** If the ring should change, offer
   `/software-architecture:radar` with the ADR linked.
8. **Review the draft** with `software-architecture:adr-reviewer`.
9. **Confirm before commit.** Show the draft; commit on a `claude/<slug>`
   branch only after the user agrees.

## Arguments

`$ARGUMENTS`: the technology name, optionally "over <alternative>, <alternative>".

## See Also

- `/software-architecture:decide` — any architectural decision.
- `/software-architecture:radar` — propose a ring change.
