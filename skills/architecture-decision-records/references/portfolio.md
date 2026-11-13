# The ADR portfolio: all ADRs in one repository

An ADR is written once and read many times, mostly as part of the set: by the
`software-architecture:adr-historian` agent, by a reviewer, and by a newcomer
reading the index. Review the set as a portfolio.

## When

- At a release or quarterly, whichever comes first.
- Before a large change in the area the ADRs govern.
- After the higher-level (enterprise or platform) ADRs change.

Run `/software-architecture:adr-audit`.

## Checks

| Check | Finding | Proposed action |
|---|---|---|
| Scope | Fails gate 1 or gate 2 (references/scope.md) | Reclassify; name the new home |
| Feature smell | Decision lists features, not a structural choice | Split: trim the ADR, move features to a spec or issue |
| Stale proposal | `Proposed` older than 30 days | Accept, reject, or close |
| Broken supersession | `Superseded by` with no back-link, or a successor that does not exist | Fix both ends |
| Missing triggers | `Accepted` with no revisit triggers | Add triggers |
| Fired trigger | A trigger's condition is now true | Supersede or re-affirm with a dated amendment |
| Duplicate | Two Accepted ADRs decide the same question | Supersede one |
| Mis-routed | Decision belongs to another governance level | Propose a move (`software-architecture:architecture-governance-levels`) |
| Remember gap | No `Constrained by:` where a binding higher-level ADR applies | Add the citation, or record a deviation |
| Conflict | Contradicts a binding higher-level ADR with no `Deviates from:` | Comply, or record the deviation and revolt |
| Revolt candidate | A `Deviates from:` ADR that has held for a release, or a local decision other repositories copy | Offer an upstream proposal |
| Fitness link | A structural ADR with no fitness function and no declared gap | Add one or declare the gap |

## Index

Keep an index (`adr generate toc`, or a table in `docs/adr/README.md`) with
number, title, status and date. Sort by number; never renumber. Show
Reclassified and Superseded entries, struck through or marked, so the
history stays readable.
