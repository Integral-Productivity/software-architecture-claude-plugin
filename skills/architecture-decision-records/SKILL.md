---
name: architecture-decision-records
description: >
  Decide whether a decision deserves an Architecture Decision Record, write
  it, and carry each ADR and a repository's whole ADR set through their
  lifecycle. Use when an architectural decision is made (repository
  structure, solution structure, quality-attribute trade-off, technology
  selection, a contract between parts or systems), when writing or editing a
  file under docs/adr/ or running `adr new`, when superseding, amending,
  deprecating or reviewing ADRs, when checking a decision against
  enterprise or platform ADRs, or when adopting a technology (drafted from
  the configured technology radars). Also use to decide that a record is NOT an
  ADR (worklog, plan, runbook, lesson, observed fact, status update) and
  route it to its own home. Pairs with `software-architecture:technology-radar`
  for technology choices and `software-architecture:architectural-trade-offs`
  for Hard Parts archetypes.
status: draft
version: 2.0.0
---


# Architecture Decision Records

Create rigorous, opinionated Architecture Decision Records (ADRs) — sharp
enough that a future contributor, or a future version of yourself, can read
the record cold and understand not just *what* was decided, but *why*, and
what would have to change for the decision to be revisited.

This skill teaches the practice. For the *where* of ADR routing (Enterprise /
Platform / System / Service / Code), see
[`software-architecture:architecture-governance-levels`](../architecture-governance-levels/SKILL.md).

## When to Write an ADR (scope test)

An ADR records an **architectural** decision. Noise in the ADR set costs
every future reader and the `software-architecture:adr-historian` agent, so
apply both gates before you write one. Full detail and worked examples:
[references/scope.md](references/scope.md).

**Gate 1: architectural scope.** The decision changes at least one of:

| Scope | Examples |
|---|---|
| Repository architecture | Module and package layout, monorepo vs polyrepo, what the repo owns and does not own, build and release surface, extension points |
| Solution architecture | Architectural style, service or component boundaries, data ownership and write paths, integration pattern, deployment topology |
| Quality-attribute trade-off | Which architectural characteristic wins (for example availability over consistency), and the fitness function that holds it |
| Technology selection | Language, framework, platform, datastore, key library |
| Contract | API, event or schema shape and its evolution policy, between parts or with other systems |

**Gate 2: the three triggers** (after Matt Pocock's `grill-with-docs`). All
three are true:

1. **Hard to reverse** — changing your mind later costs meaningful rework.
2. **Surprising without context** — a future reader will ask "why this way?"
3. **A real trade-off** — there were genuine alternatives, and you chose one
   for stated reasons.

If either gate fails, **do not write an ADR**. Put the record in its own home:

| It is a… | Put it in |
|---|---|
| Worklog, session log, "what we did" | The PR body, the issue, or a session ledger |
| Feature definition: what the solution does for its users, commands, options, fields, screens, acceptance criteria | A PRD or specification in the product-management tool, or a GitHub issue |
| Plan or task breakdown | `docs/plans/` or the tracker |
| Runbook or how-to | `docs/runbooks/` or `docs/` |
| Lesson, gotcha, client or tool quirk | `docs/solutions/` (a solution note) |
| Observed fact or inventory (where DNS is hosted, which plan we are on) | A fact register or the system's own config; amend the ADR that assumed otherwise only if a decision changes |
| Status or progress update | The tracker or the PR |
| Convention with no real alternative (naming, formatting) | `CONTRIBUTING.md`, a linter rule |
| One-PR implementation choice | The PR body |

**Feature smell.** An ADR records *how the system is shaped* and *why*, not
*what it does*. If the Decision lists features (commands, flags, columns,
fields, screens, user steps) instead of a choice among structural options,
move the feature list to the spec or issue, and keep only the structural
choice and its trade-off in the ADR, linked to the spec.

When a gate fails, say which gate and name the home in one line. Do not
"lean toward writing it": a missing ADR is found by review
(`/software-architecture:review`); a noise ADR stays forever.

## ADR Anatomy

Every ADR must answer six questions:

1. **Context** — What situation prompted this decision? Who is affected?
   What constraints are in play? This section must stand alone: a reader
   with no prior context should understand the situation after reading it.

2. **Decision** — What was decided? State it in one paragraph. If you can't
   state it in one paragraph, the decision isn't crisp enough yet.

3. **Status** — one lifecycle state with its date: `Proposed`,
   `Accepted`, `Amended`, `Superseded by ADR-NNN`, `Deprecated`, `Rejected`
   or `Reclassified`. Add `Constrained by:` (higher-level ADRs this one
   follows) and, when it applies, `Deviates from:` (a binding higher-level
   ADR this one departs from). Add `Provenance:` naming the tracked work
   item that asked for the decision, by ID: a GitHub issue (`owner/repo#N`
   or its URL), a Productboard product, component, feature or sub-feature
   (ID or URL), or a GlassFrog project ID. A chat thread or meeting can be
   cited next to the ID, never instead of it. No work item, no acceptance:
   create the item first. See "Lifecycle" below.

4. **Options considered** — What alternatives were evaluated? Evaluate each
   on the same set of dimensions so options are comparable.

5. **Consequences** — What does this decision make easier? What does it
   make harder? Be honest about costs — every decision closes some doors.

6. **Revisit triggers** — What specific, measurable conditions would prompt
   revisiting this decision? Not "we might reconsider someday" but "if X
   exceeds Y, evaluate alternative Z."

## Quality Checklist

Before marking an ADR `Accepted`, verify:

- [ ] It passes both scope gates (architectural scope and the three triggers)
- [ ] No feature smell: the Decision names a structural choice, not a list
      of features; feature detail is linked, not copied
- [ ] Reviewed by the `software-architecture:adr-reviewer` agent
- [ ] A `Provenance:` line names a GitHub issue, Productboard entity or
      GlassFrog project by ID
- [ ] Higher-level ADRs were read in Context Sources order and cited on a
      `Constrained by:` line; any departure is on a `Deviates from:` line
- [ ] Context stands alone — no prior knowledge required
- [ ] Decision is one paragraph
- [ ] Every option is evaluated on identical dimensions
- [ ] Trade-off analysis explains *reasoning*, not just conclusions
- [ ] Consequences name at least one cost
- [ ] Revisit triggers are specific and measurable
- [ ] ADR is numbered and committed on an `adr/<slug>` branch
- [ ] ADR lives in the correct repo per the governance-levels routing table

## Lifecycle of one ADR

Detail and the transition table: [references/lifecycle.md](references/lifecycle.md).

```
Proposed ──accept──▶ Accepted ──amend──▶ Amended
    │                   │  │
  reject              supersede  deprecate
    ▼                   ▼         ▼
 Rejected          Superseded  Deprecated
Any state ──reclassify (failed the scope test)──▶ Reclassified
```

- **Never rewrite an Accepted Decision.** Add a dated amendment that does not
  change the decision's direction, or write a superseding ADR that does.
- **Every transition is two-way linked and dated.** A superseding ADR names
  what it supersedes; the old ADR names its successor.
- **On a change, review the revisit triggers** and any fitness function that
  cites the ADR.
- **The lifecycle sets how hard the rules bite** (ADR-0009). The fitness
  function `fitness/adr-lifecycle.mjs` reports a Proposed ADR's gaps as info,
  a newly Accepted ADR's gaps as warnings, and fails CI once an Accepted ADR
  has been past its curing period (default 30 days) with gaps left. Fix the
  gaps while the ADR is Proposed.
- **Reclassify, do not delete.** An ADR that fails the scope test keeps its
  number and file, gets `Reclassified`, and points to the record's new home.

## The ADR portfolio (one repository)

ADRs are read as a set, so keep the set healthy. Run
`/software-architecture:adr-audit` at a release, a quarter, or before a large
change. It reports reclassify candidates, stale `Proposed` records, broken
supersession links, `Accepted` records with no revisit triggers, conflicts
with binding higher-level ADRs, and revolt candidates. It proposes; you
decide. Detail: [references/portfolio.md](references/portfolio.md).

## Higher-level ADRs: remember and revolt

Decisions nest. A repository's ADRs live inside its platform's and its
enterprise's. `ARCHITECTURE.md` can list these homes in a
`## Context Sources` table, in load order from the slowest, widest level to
the fastest, narrowest (set it with `/software-architecture:context`).

- **Remember (top-down):** before you decide, read the `binding` sources in
  order. Cite each ADR that constrains this decision on `Constrained by:`.
  Treat `advisory` sources as input, not as constraints.
- **Revolt (bottom-up):** when a local decision departs from, or proves a
  better way than, a binding higher-level ADR, record `Deviates from:` with
  the reason, and offer the user an upstream proposal through that source's
  revolt channel. Do not let the local ADR silently override the higher one.

These are the two cross-scale links of panarchy (Gunderson and Holling,
*Panarchy*, 2002). Detail and the table format:
[references/panarchical-context.md](references/panarchical-context.md).

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

A technology-adoption ADR is drafted from the radars, not from memory. Use
`/software-architecture:adopt`, or follow
[references/technology-adoption.md](references/technology-adoption.md):

1. Read the `## Radar Sources` table in `ARCHITECTURE.md` (org radar file,
   radar service, Thoughtworks), in order.
2. Look up every option on every radar with
   `software-architecture:technology-radar`.
3. Let the org ring shape the ADR: Trial needs scope and exit criteria; Hold
   needs a `Deviates from:` line and an upstream proposal; not on the radar
   is treated as Assess.
4. Add a "Radar evidence" section, a radar row in the options table, and
   radar revisit triggers.
5. Offer `/software-architecture:radar` to move the ring to match the ADR.

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
