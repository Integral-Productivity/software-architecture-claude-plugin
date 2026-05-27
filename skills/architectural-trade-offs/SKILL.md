---
name: architectural-trade-offs
description: >
  Apply Neal Ford's Software Architecture: The Hard Parts trade-off analysis
  framework — "everything is a trade-off." Use when facing a hard
  architectural decision involving service granularity, coupling and
  cohesion, distributed data ownership, sagas / orchestration / choreography,
  or contract evolution. Walks through the Hard Parts archetype matching
  the situation, surfaces the trade-off dimensions, and feeds the result
  into an ADR via `software-architecture:architecture-decision-records`.
status: draft
version: 1.0.0
---

# Architectural Trade-Offs (The Hard Parts)

From Ford, Richards, Sadalage, and Dehghani, *Software Architecture: The
Hard Parts*:

> **Everything in software architecture is a trade-off.**

> **If you think you've found a benefit without a trade-off, you haven't
> looked hard enough yet.**

This skill teaches the trade-off-reasoning *meta-process*. The specific
archetypes — granularity, coupling, data ownership, sagas, contracts —
live in `decision-archetypes/` and are loaded on demand.

## The Trade-Off Meta-Process

For any hard architectural decision:

### Step 1 — Name the decision

State it as a single forced choice: *"Should the order service own
inventory writes, or should inventory be its own service?"*

If you can't state it as a forced choice, the decision isn't crisp enough
yet. Refine.

### Step 2 — Identify the archetype

Match the decision to one of the Hard Parts archetypes:

| Archetype | Pattern | Reference |
|---|---|---|
| **Granularity** | "Should X be one service or N services?" | [`decision-archetypes/granularity.md`](decision-archetypes/granularity.md) |
| **Coupling & cohesion** | "How tightly should X and Y connect?" | [`decision-archetypes/coupling-and-cohesion.md`](decision-archetypes/coupling-and-cohesion.md) |
| **Data ownership** | "Which service owns data X?" | [`decision-archetypes/data-ownership.md`](decision-archetypes/data-ownership.md) |
| **Sagas & orchestration** | "How do we coordinate a workflow across services?" | [`decision-archetypes/sagas-and-orchestration.md`](decision-archetypes/sagas-and-orchestration.md) |
| **Contracts & evolution** | "How do we evolve the API between X and Y?" | [`decision-archetypes/contracts-and-evolution.md`](decision-archetypes/contracts-and-evolution.md) |

Load only the archetype file you need.

### Step 3 — Apply the archetype's trade-off table

Each archetype file contains a table of **integrators** (forces pulling
you toward consolidation / tight coupling / shared ownership) and
**disintegrators** (forces pulling you toward separation / loose coupling /
distributed ownership). Score each force for the specific decision.

### Step 4 — Examine the costs

Whichever direction wins, name the cost. *"This direction makes X easier.
What does it make harder?"* If you can't name a cost, look harder.

### Step 5 — Capture as ADR

Hand off to
[`software-architecture:architecture-decision-records`](../architecture-decision-records/SKILL.md).
Include the trade-off table from Step 3 in the ADR's "Options considered"
section.

## Why "Everything Is a Trade-Off" Matters

The naive question is *"what's the right answer?"* — and there isn't one
unconditional. Every Hard Parts decision answers conditionally:

> *"For this system, with these characteristics prioritized, at this
> scale, given these team capabilities, the trade-off favors X — at the
> cost of Y."*

Strip out any of those conditions, and the answer can flip. ADRs capture
the conditions so the reasoning survives the people who made the decision.

## When to Invoke Each Archetype

### Granularity
Trigger phrases: "should this be a separate service," "split this up,"
"too big," "too small," "service boundary," "merge these."

### Coupling & cohesion
Trigger phrases: "these talk too much," "tight coupling," "should they
share," "should they be independent."

### Data ownership
Trigger phrases: "who owns this data," "single source of truth," "write
path," "duplicated data."

### Sagas & orchestration
Trigger phrases: "distributed transaction," "saga," "compensating action,"
"orchestrator," "choreography," "workflow."

### Contracts & evolution
Trigger phrases: "API versioning," "breaking change," "schema evolution,"
"backwards compatibility."

## Output

Every trade-off analysis produces:

1. The forced-choice statement (Step 1)
2. The applied archetype + trade-off table (Steps 2–3)
3. The named cost of the chosen direction (Step 4)
4. An ADR draft (Step 5)

The plugin's `/software-architecture:trade-off` command applies this
process without committing to an ADR — useful when you want to *think* an
architectural decision through but aren't ready to record it.

`/software-architecture:decide` chains trade-off → ADR in one flow.

## Hand-Offs

| If the trade-off involves… | …also invoke |
|---|---|
| A technology choice | [`software-architecture:technology-radar`](../technology-radar/SKILL.md) |
| Defining what "good" looks like | [`software-architecture:architectural-characteristics`](../architectural-characteristics/SKILL.md) |
| Verifying the chosen direction over time | [`software-architecture:architectural-fitness-functions`](../architectural-fitness-functions/SKILL.md) |
| Service decomposition by domain | [`software-architecture:event-storming-for-architecture`](../event-storming-for-architecture/SKILL.md) |
| Recording the decision | [`software-architecture:architecture-decision-records`](../architecture-decision-records/SKILL.md) |
