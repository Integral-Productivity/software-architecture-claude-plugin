# Sagas and Orchestration Archetype

> Source: *Software Architecture: The Hard Parts*, chs 11–12 (managing
> distributed workflows; saga patterns).

The workflow question: **"How do we coordinate a workflow across services?"**

Equivalent framings:
- This used to be a database transaction; how do we do it across services?
- Should a central component drive the flow, or should each service react?
- What happens when step 3 of 5 fails — how do we roll back?

## Why You Can't Just Use Transactions

A single-database transaction provides ACID — atomicity, consistency,
isolation, durability — for free. Once you cross a service boundary, you
get **none** of that automatically. The work has to be done explicitly,
and you can never get back to pure ACID.

The replacement is the **saga**: a long-lived workflow where each step is
its own local transaction, and failures are handled by **compensating
actions** (logical undo) rather than rollback.

## Two Saga Styles

### Orchestration

A central component (the orchestrator) drives the workflow. It calls
service A, then service B, then service C. On failure, the orchestrator
calls compensations in reverse.

**Pros:**
- Workflow logic is centralized — easy to read, easy to evolve.
- Failure handling is explicit.
- Observability is straightforward — one log shows the whole story.

**Cons:**
- The orchestrator is a single point of failure (or coordination overhead).
- Services are coupled to the orchestrator's expectations.
- Orchestrator can become a god-object as workflows accumulate.

**Common implementations:** Temporal, Camunda, AWS Step Functions, custom
state machines.

### Choreography

Each service publishes events when it acts. Other services subscribe and
react. No central driver.

**Pros:**
- No coordination bottleneck.
- Loose coupling — services don't know about each other.
- Highly scalable — fan-out is trivial.

**Cons:**
- Workflow is implicit — emerges from event chains; hard to read.
- Failure handling is distributed — each service must know its
  compensations.
- Observability is hard — reconstructing the workflow requires correlating
  events across services.

**Common implementations:** Event-driven architectures on Kafka, RabbitMQ,
NATS.

## Hard Parts Saga Variants

The book identifies eight saga variants based on three axes:
**communication** (sync / async), **consistency** (atomic / eventual),
**coordination** (orchestrated / choreographed). The 2³ matrix produces:

| Variant | Communication | Consistency | Coordination | Notes |
|---|---|---|---|---|
| **Epic Saga** | Sync | Atomic | Orchestrated | Most ACID-like; rare in practice; orchestrator + 2PC-style |
| **Phone Tag Saga** | Sync | Atomic | Choreographed | Hard to reason about |
| **Fairy Tale Saga** | Sync | Eventual | Orchestrated | Common — orchestrator + retries |
| **Time Travel Saga** | Sync | Eventual | Choreographed | Brittle |
| **Fantasy Fiction Saga** | Async | Atomic | Orchestrated | Workflow engines with txn guarantees |
| **Horror Story Saga** | Async | Atomic | Choreographed | Generally avoid |
| **Parallel Saga** | Async | Eventual | Orchestrated | Common — orchestrated async workflows |
| **Anthology Saga** | Async | Eventual | Choreographed | Pure event-driven microservices |

The most common production patterns are **Parallel** (async/eventual/
orchestrated, e.g., Temporal) and **Anthology** (async/eventual/
choreographed, e.g., Kafka-based event-driven).

## Trade-Off Table

For each cross-service workflow:

| Force | Orchestration | Choreography |
|---|---|---|
| Workflow visibility | High (centralized) | Low (must reconstruct) |
| Failure handling clarity | High (explicit) | Lower (distributed) |
| Loose coupling | Lower (services coupled to orchestrator) | Higher |
| Single point of failure | Yes (orchestrator) | No |
| Evolvability | Lower (orchestrator must change) | Higher (add new subscribers) |
| Cognitive load | Lower (one place to read) | Higher (event web) |
| Operational tooling | Mature (Temporal, etc.) | Diverse |

## Compensating Actions Design

For every step in a saga, define its compensation up front. Each
compensation must be **idempotent** and **commutative with subsequent
work**.

**Bad compensation:**
- *"Delete the order."* (What if downstream services already saw it?)

**Good compensation:**
- *"Mark the order CANCELLED. Idempotent; downstream services will see
  the cancellation event and act accordingly."*

The compensation must work even if the original step half-completed. If
step 3 of 5 created records, made API calls, and emitted events,
compensation must reverse (or supersede) each.

## Idempotency Is Mandatory

In any async/eventual saga, every step must be idempotent. Otherwise
retries (which WILL happen) cause double-effects.

Fitness functions for idempotency:
- Same input → same outcome regardless of replay count.
- Effect can be detected before re-execution.
- Events carry deduplication keys.

## Decision Process

### Step 1 — Identify the workflow

Name it. Diagram the happy path. List the services involved.

### Step 2 — Identify the consistency budget

How stale can the workflow's results be from each participant's
perspective?

| Budget | Implies |
|---|---|
| Real-time (< 1s) | Sync; probably orchestrated |
| Near-real-time (1s–1min) | Async + orchestrated |
| Eventual (mins–hours) | Async + choreography is viable |
| Long-running (hours+) | Always orchestrated with a workflow engine |

### Step 3 — Identify the failure modes

For each step, what could fail? What's the compensation?

If you can't name the compensation, you don't have a saga — you have a
brittle distributed call chain.

### Step 4 — Choose the variant

Apply the 8-variant table. Most projects converge on Parallel
(orchestrated async) or Anthology (choreographed async).

### Step 5 — Document

File ADR via
[`software-architecture:architecture-decision-records`](../../architecture-decision-records/SKILL.md).

Include:
- Workflow diagram
- Variant chosen + rationale
- Compensation actions for each step
- Idempotency strategy

## Anti-Patterns

- **No compensations** — you have a happy-path chain, not a saga.
- **Compensations that don't compose** — saga must be ABLE to roll back
  even from arbitrary failure points.
- **Synchronous distributed saga across many services** — couples
  availability of all services to availability of the workflow.
- **Hidden orchestrator** — an "event-driven" system where one service
  actually drives everything via event ordering; pretending it's
  choreographed obscures the truth.

## Hand-Off

After deciding, encode as fitness functions:

- "Every saga step has a compensation action defined" (structural)
- "Every event handler is idempotent" (behavioral / test)
- "Workflow trace can be reconstructed from logs alone" (observability)

See [`software-architecture:architectural-fitness-functions`](../../architectural-fitness-functions/SKILL.md).
