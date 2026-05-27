---
name: event-storming-for-architecture
description: >
  Apply event-driven Domain-Driven Design to architectural decomposition —
  event storming, bounded contexts, context maps, and service boundaries.
  Use when designing the architecture of a new system, decomposing a
  monolith, identifying bounded contexts, mapping domain events to
  services, or applying DDD strategic design as architectural reasoning.
  Pairs with `software-architecture:architectural-trade-offs` (granularity
  archetype) when the question is "how should we draw service boundaries."
status: draft
version: 1.0.0
---

# Event Storming for Architecture

Event Storming and Domain-Driven Design are usually framed as *modeling
techniques*. This skill adds an architectural framing: **event storming
produces the raw material for service decomposition; bounded contexts ARE
service boundaries; context maps ARE the architectural topology.**

You are a software engineer and architect with a deep understanding of
DDD and event-driven architecture, in the tradition of Eric Evans and
Martin Fowler. Be technical and concrete; minimize business jargon. Ask
clarifying questions to resolve ambiguity. Drive toward idiomatic DDD
and event-driven architecture.

## When to Apply This Skill

- Designing a new system from scratch
- Decomposing a monolith (Hard Parts Part I)
- Identifying bounded contexts or aggregate boundaries
- Mapping domain events to services or topics
- Choosing between orchestration and choreography
- Negotiating service boundaries during architectural design

## The Architectural Move

Event storming surfaces three things from the domain:

| Surfaced from domain | Architectural implication |
|---|---|
| **Domain events** | Topic / event-stream names; integration points |
| **Aggregates** | Transactional boundaries; consistency requirements |
| **Bounded contexts** | Service boundaries; team-cognitive boundaries |

The architectural skill is to *not* over-translate. Not every event
becomes a kafka topic; not every aggregate becomes a microservice. Apply
the granularity archetype in
[`software-architecture:architectural-trade-offs/decision-archetypes/granularity.md`](../architectural-trade-offs/decision-archetypes/granularity.md)
to decide what stays inside one service vs. what crosses a boundary.

## Big Picture Event Storming

The first session maps the entire domain as a timeline of events.

**Outputs:**
- Orange sticky notes — domain events (past-tense verbs: "Order Placed")
- Pink sticky notes — hot spots / open questions
- Yellow sticky notes — actors
- Blue sticky notes — commands
- Lavender sticky notes — read models / views

**Architectural reading:**
- Events that cluster in time and around the same nouns → candidates for
  a single bounded context.
- Hot spots → likely candidates for architectural decisions worth ADRing.
- Commands that frequently cross between event clusters → integration
  points that need contract design.

## Process-Level Event Storming

After Big Picture, drill into one process or workflow:

**Outputs:**
- Aggregates (yellow boxes) — the consistency boundary
- Policies (purple) — when X happens, do Y
- Read models — what views does each actor need?

**Architectural reading:**
- An aggregate is the smallest transactional unit. Single-aggregate
  operations → simple. Multi-aggregate operations → likely need sagas
  (see `decision-archetypes/sagas-and-orchestration.md`).
- Policies that span aggregates within one bounded context → in-process
  event handlers. Policies that span bounded contexts → integration
  events (likely a topic).

## Context Mapping

A context map is the architectural topology of bounded contexts.

Relationships to mark on the map:

| Relationship | Meaning | Architectural implication |
|---|---|---|
| **Shared Kernel** | Two contexts share a model | Tight coupling — usually a code smell at the architecture level |
| **Customer / Supplier** | Downstream depends on upstream; upstream accommodates | Negotiated contract; SLA |
| **Conformist** | Downstream conforms to upstream model | One-way dependency; downstream has no leverage |
| **Anti-Corruption Layer** | Downstream translates upstream model | Insulates from upstream changes — adds resilience |
| **Open Host Service** | Upstream publishes a clean public API | Stable contract; multiple consumers can conform |
| **Published Language** | Shared open format (e.g., event schema) | Decouples through schema |
| **Separate Ways** | No integration | Lowest coupling; highest divergence |

The architect's job is to choose relationships *deliberately* — not to
discover them after deployment.

## Mapping to Hard Parts Archetypes

| DDD concept | Hard Parts archetype |
|---|---|
| Aggregate boundary | Service granularity (aggregate = candidate service) |
| Bounded context | Service boundary (context = candidate macro-service) |
| Context map relationship | Coupling style (anti-corruption layer = loose; shared kernel = tight) |
| Aggregate consistency rules | Data ownership (each aggregate owns its data) |
| Cross-aggregate workflow | Saga vs orchestration choice |
| Open Host Service / Published Language | Contract evolution |

When event-storming produces a model, walk through the table above and
file ADRs for each architectural choice the model implies.

## Output: Bounded Context Glossary

Every bounded context should have a `CONTEXT.md` capturing its glossary —
the language used inside the context. Different contexts can use the same
word for different things (e.g., "Customer" in Sales ≠ "Customer" in
Billing), and the glossary makes this explicit.

For the `/grill-with-docs` pattern used in this monorepo, see
[`anthropic-skills:grill-with-docs`](../../../../) — the convention is to
challenge new terms against the existing glossary as they arise.

## Output: ADRs

After an event storming session, expect to file ADRs for:

- Why these bounded contexts (and not others)
- Service granularity decisions (which contexts get their own service)
- Data ownership (which context owns each aggregate)
- Integration style (sagas / orchestration / direct calls / events)
- Context-map relationships chosen (and why)

Use [`software-architecture:architecture-decision-records`](../architecture-decision-records/SKILL.md)
for the ADRs themselves.
