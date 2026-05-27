# Granularity Archetype

> Source: *Software Architecture: The Hard Parts*, ch. 7 (Service
> Granularity), Ford, Richards, Sadalage, Dehghani.

The granularity question: **"How big should a service be?"**

Equivalent framings:
- Should X be one service or N services?
- Should we split this service?
- Should we merge these services?
- Where should a new module / feature live?

There is **no universal answer**. Ford explicitly rejects "microservices
are always best" and "modular monolith is always best." Granularity is a
trade-off between **integrators** (forces pulling toward consolidation)
and **disintegrators** (forces pulling toward separation).

## Disintegrators (forces pulling toward smaller services)

Ford's six disintegrators:

| Disintegrator | When this force is strong |
|---|---|
| **Service scope and function** | The service is doing too many unrelated things. Multiple core domain concepts in one codebase. |
| **Code volatility** | Different parts of the code change at very different rates. A volatile part dragging a stable part through redeploys. |
| **Scalability and throughput** | Different parts of the code need very different scale profiles (one part is read-heavy, another write-heavy; one needs 100 replicas, another 1). |
| **Fault tolerance** | One part of the code can fail without bringing the rest down. Co-located code can't isolate failures. |
| **Security** | Different parts need different access boundaries; co-location forces the most permissive boundary on everything. |
| **Extensibility** | Adding new functionality requires touching multiple unrelated areas. A natural extension point keeps getting clogged. |

## Integrators (forces pulling toward larger services)

Ford's four integrators:

| Integrator | When this force is strong |
|---|---|
| **Database transactions** | Operations need ACID across multiple aggregates. Distributed transactions are costly and fragile. |
| **Workflow and choreography** | Many cross-service calls in the workflow. Network overhead dominates work. |
| **Shared code** | Significant logic is shared between candidates; duplication or distribution would be expensive. |
| **Data relationships** | Data shapes are tightly entangled. Splitting forces complex joins across the network. |

## The Trade-Off Table

For a candidate split (or merge), score each force on a 1–5 scale where 5
= "this force is very strong here."

| Force | Direction | Score (1–5) | Rationale |
|---|---|---|---|
| Service scope and function | Split | … | … |
| Code volatility | Split | … | … |
| Scalability and throughput | Split | … | … |
| Fault tolerance | Split | … | … |
| Security | Split | … | … |
| Extensibility | Split | … | … |
| **Sum (Split)** | | … | |
| Database transactions | Merge | … | … |
| Workflow and choreography | Merge | … | … |
| Shared code | Merge | … | … |
| Data relationships | Merge | … | … |
| **Sum (Merge)** | | … | |

The sums are *signals*, not verdicts. A 22 vs 18 leans split, but the
specific 5s matter more than the totals.

## Decision

The decision is the side that wins **plus** the named cost from the
losing side. Examples:

- *"Split. Cost: we accept distributed transactions for the
  order-vs-inventory write path and will use a saga (see
  `decision-archetypes/sagas-and-orchestration.md`)."*
- *"Merge. Cost: redeploys are coupled; we accept that ops cadence is
  driven by the volatile part."*

## Revisit Triggers

Granularity decisions are not permanent. Revisit when:

- One disintegrator score increases by ≥ 2 (a previously weak force
  strengthens — e.g., a co-located feature now needs much higher scale).
- A new disintegrator emerges (e.g., a new security boundary requirement).
- Team size doubles and the team splits along a fault line that doesn't
  match service boundaries (Conway's Law signal).
- Deployment friction reaches a threshold (e.g., > 2 redeploys/week for
  unrelated changes).

## Anti-Patterns

- **Splitting for splitting's sake.** "We should do microservices" is
  not a rationale.
- **One disintegrator outweighing all integrators.** A 5/5 on
  *scalability* doesn't justify ignoring strong database-transaction
  needs — solve the transactions some other way (saga), then evaluate
  whether the split still pays.
- **Refusing to merge.** Splits can be wrong; granularity decisions go
  both ways.

## Hand-Off

After deciding, file ADR via
[`software-architecture:architecture-decision-records`](../../architecture-decision-records/SKILL.md).

Include the trade-off table verbatim in "Options considered."

Then encode the decision as fitness functions:

- "Service X contains only domain Y" (structural)
- "Service X deploys independently of Service Z" (process / operational)

See [`software-architecture:architectural-fitness-functions`](../../architectural-fitness-functions/SKILL.md).
