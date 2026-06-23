---
name: architecture-decision-records
description: >
  Create Architecture Decision Records for any project — technology choices,
  design trade-offs, infrastructure decisions, API design, integration
  patterns, or any one-way-door decision. Use whenever an architectural
  decision is being made, even without saying "ADR." Trigger on "should we
  use X or Y," "how should we architect," "what's the right approach for,"
  "document why we chose X," "moving from X to Y," or any choice that is
  hard to reverse. Invoke `software-architecture:technology-radar` alongside
  this skill when the decision involves selecting a technology, and
  `software-architecture:architectural-trade-offs` when applying a Hard
  Parts archetype.
status: draft
version: 1.0.0
---

# Architecture Decision Records

Create rigorous, opinionated Architecture Decision Records (ADRs) — sharp
enough that a future contributor, or a future version of yourself, can read
the record cold and understand not just *what* was decided, but *why*, and
what would have to change for the decision to be revisited.

This skill teaches the practice. For the *where* of ADR routing (Enterprise /
Platform / System / Service / Code), see
[`software-architecture:architecture-governance-levels`](../architecture-governance-levels/SKILL.md).

## When to Write an ADR

Write an ADR for **one-way doors** — decisions that are costly or disruptive
to reverse. Common examples:

- API protocol or surface design (REST, GraphQL, webhooks, event schemas)
- Data modeling decisions (domain model shape, ID strategy, schema evolution)
- Infrastructure and deployment choices (hosting, databases, edge vs. origin)
- Integration patterns (how services connect, adapter strategy)
- Authentication and authorization architecture
- Technology selection (language, framework, key library)
- Service boundary decisions (granularity, decomposition strategy)
- Distributed-data ownership (which service owns which write path)

**Skip the ADR** for two-way doors — decisions you can easily reverse without
significant rework. If you're not sure, lean toward writing it. A short ADR
costs 10 minutes; undoing a bad decision costs days.

The three triggers from the `/grill-with-docs` skill are useful here. Only
offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful.
2. **Surprising without context** — a future reader will wonder "why did
   they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and
   you picked one for specific reasons.

If any of the three is missing, skip the ADR.

## ADR Anatomy

Every ADR must answer six questions:

1. **Context** — What situation prompted this decision? Who is affected?
   What constraints are in play? This section must stand alone: a reader
   with no prior context should understand the situation after reading it.

2. **Decision** — What was decided? State it in one paragraph. If you can't
   state it in one paragraph, the decision isn't crisp enough yet.

3. **Status** — `Proposed` / `Accepted` / `Superseded by ADR-NNN` /
   `Deprecated`.

4. **Options considered** — What alternatives were evaluated? Evaluate each
   on the same set of dimensions so options are comparable.

5. **Consequences** — What does this decision make easier? What does it
   make harder? Be honest about costs — every decision closes some doors.

6. **Revisit triggers** — What specific, measurable conditions would prompt
   revisiting this decision? Not "we might reconsider someday" but "if X
   exceeds Y, evaluate alternative Z."

## Quality Checklist

Before marking an ADR `Accepted`, verify:

- [ ] Context stands alone — no prior knowledge required
- [ ] Decision is one paragraph
- [ ] Every option is evaluated on identical dimensions
- [ ] Trade-off analysis explains *reasoning*, not just conclusions
- [ ] Consequences name at least one cost
- [ ] Revisit triggers are specific and measurable
- [ ] ADR is numbered and committed on an `adr/<slug>` branch
- [ ] ADR lives in the correct repo per the governance-levels routing table

## adr-tools Commands

```bash
adr new <Title Words Here>          # create next numbered ADR, opens in $EDITOR
adr list                            # list all ADRs with numbers and titles
adr generate toc                    # generate a table of contents
adr link <source-num> "<label>" <target-num> "<reverse-label>"
adr new -s <old-num> <New Title>    # create superseding ADR, marks old as superseded
```

ADRs live in `docs/adr/` by convention. Check `.adr-dir` in the repo root to
confirm the path before running commands. If `.adr-dir` doesn't exist,
offer to initialize: `adr init docs/adr`.

## Branch Naming

- New ADR: `adr/<short-slug>`
- Revision: `adr/<short-slug>/update`

If your workflow distinguishes agent-authored work (e.g. for auto-merge
on green CI), apply that branch convention here too — for example a
`claude/<slug>` prefix for Claude-authored ADRs.

## Options Evaluation

Use a consistent table format so options are comparable:

| Dimension | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Complexity | … | … | … |
| Reversibility | … | … | … |
| Team familiarity | … | … | … |
| Operational overhead | … | … | … |
| Cost | … | … | … |

Add decision-specific dimensions as needed. The core set ensures
cross-ADR comparability.

## Technology Decisions

When the ADR involves selecting a technology, invoke
`software-architecture:technology-radar` before writing the options section.
The radar check provides:

- Thoughtworks ring placement (Adopt / Trial / Assess / Hold)
- Your org's custom radar placement (if configured)
- Recent movement signal (reassessed up or down)

Include the radar findings in the options table. An option at "Hold" on the
Thoughtworks radar needs a stronger justification than one at "Adopt."

## Hard Parts Decisions

When the decision involves a Hard Parts archetype — service granularity,
coupling/cohesion, data ownership, sagas/orchestration, or contract
evolution — invoke `software-architecture:architectural-trade-offs` to
apply the archetype-specific question set before writing the ADR.

## Relationship to Architectural Fitness

The ADR records *why* the system is designed a certain way. Fitness
functions record *what* the system must look like. These are complementary:

- When a fitness check encodes a rule that isn't obvious, add an ADR
  reference comment in the fitness file.
- When writing an ADR that introduces a structural constraint, follow up
  by encoding that constraint as a fitness function (see
  `software-architecture:architectural-fitness-functions`).

## Routing: where should this ADR live?

ADRs live at the level of decision they describe. See
[`software-architecture:architecture-governance-levels`](../architecture-governance-levels/SKILL.md)
for the full routing model. Quick rules:

| Decision scope | Goes to |
|---|---|
| Cross-product / org-wide | your shared standards repo's `docs/adr/` |
| CI / DevOps / platform | your platform/DevOps repo's `docs/adr/` |
| Product-specific | This product's `docs/adr/` |

The `adr-historian` agent reads the routing table from the repo-local
`ARCHITECTURE.md` (produced by `/software-architecture:context`) to find
prior decisions at any level.
