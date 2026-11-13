# Lifecycle of one ADR

An ADR is immutable in its decision and mutable in its status (Nygard 2011).
Each state below has a dated status line.

## States

| State | Meaning |
|---|---|
| Proposed | Drafted; open for review. Not yet binding. |
| Accepted | The decision holds. Binding at its governance level. |
| Amended | Accepted, with dated additive amendments that keep its direction. |
| Superseded | Replaced by a newer ADR, named on the status line. |
| Deprecated | No longer applies, and nothing replaces it (the thing it governed is gone). |
| Rejected | A Proposed decision that was not taken. Keep it: it records an option weighed. |
| Reclassified | Failed the scope test. The record moved to its proper home; the file stays as a pointer. |

## Transitions

| From → To | Needs |
|---|---|
| Proposed → Accepted | Quality checklist passes; the person with authority at this level accepts; acceptance date. |
| Proposed → Rejected | Reason and date. |
| Accepted → Amended | A dated `### Amendment YYYY-MM-DD` section that adds, and does not reverse, the decision. If it reverses or narrows the decision, supersede instead. |
| Accepted/Amended → Superseded | A new ADR whose status says `Supersedes ADR-NNN`; the old status says `Superseded by ADR-MMM` with the date. `adr new -s NNN <title>` does both. |
| Accepted/Amended → Deprecated | Reason and date; name any fitness function to remove. |
| Any → Reclassified | The new home (path or link) and date. Keep the number; never renumber. |

## On every transition

1. Update both ends of each link.
2. Review the revisit triggers. A trigger that fired is the usual reason to
   supersede.
3. Find fitness functions and code comments that cite the ADR
   (`grep -r "ADR-NNN"`), and update or remove them.
4. If the ADR is cited as `Constrained by:` in a lower-level repository,
   tell the user which repositories are affected.

## Revisit triggers keep an ADR alive

A trigger is specific and measurable: "if p95 latency exceeds 300 ms for a
week, evaluate a read replica". Check triggers in the portfolio audit. An
Accepted ADR with no trigger is a lifecycle defect.
