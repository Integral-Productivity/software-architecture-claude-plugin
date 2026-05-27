# Data Ownership Archetype

> Source: *Software Architecture: The Hard Parts*, chs 9–10 (data
> ownership and distributed data access).

The data-ownership question: **"Which service owns data X?"**

Equivalent framings:
- Who is the source of truth for X?
- Who can write to X? Who can only read?
- Should X be replicated, federated, shared, or owned?

## The Core Principle

In a service-oriented architecture, **the service that exposes the write
path owns the data**. Reads can be served from anywhere (cache, replica,
read model), but writes converge on the owner.

This is the **single-writer principle**. It is the simplest pattern that
actually works at scale. Violating it (multiple writers to the same
record) creates lost-update bugs that don't show up in testing.

## Five Ownership Patterns

Ford et al. enumerate five access patterns. Each has trade-offs.

### 1. Single Ownership

Service A owns and exposes data X. Other services call A's API to read.

**Pros:** Clearest contract; easiest to reason about.
**Cons:** Read latency = network call. Read availability = A's availability.

### 2. Common Ownership (Shared Database — anti-pattern)

Two or more services write to the same table.

**Pros:** No data movement.
**Cons:** Lost updates; schema changes are cross-team; deployment
coupling; nobody owns the contract.

> **Verdict:** Avoid for new design. If inherited, this is a top-priority
> ADR for migration.

### 3. Joint Ownership (also avoid for new design)

Two services share write responsibility through a coordination protocol
(e.g., distributed lock).

**Pros:** Theoretically clean.
**Cons:** Coordination overhead; complex failure modes.
**Verdict:** Usually a sign that the service boundary is wrong; see
`granularity.md`.

### 4. Service Consolidation

If two services need to jointly own data, **merge them**. The data
becomes single-ownership of the merged service.

**Pros:** Removes the coordination problem entirely.
**Cons:** May violate other granularity forces; see `granularity.md`.

### 5. Data Domain (Federated Read)

Service A owns the writes; multiple services receive read replicas (via
CDC, events, or scheduled exports).

**Pros:** Reads are local, fast, available even if A is down.
**Cons:** Eventual consistency; replicas drift if pipeline fails;
governance complexity.

## Decision Process

### Step 1 — Identify the write path

For each piece of data, list every place it's currently written. If
there's > 1, you have a Common Ownership problem.

### Step 2 — Identify the read demand

For each piece of data, list every place it's read and the read latency
SLO. If reads need < 50ms p99 and the owner is 200ms away, federation
is on the table.

### Step 3 — Match the pattern

| Situation | Pattern |
|---|---|
| Single writer, few readers, low read latency demand | Single Ownership |
| Single writer, many readers, latency-sensitive | Data Domain (federated reads) |
| Multiple writers — fundamental | Consolidate, OR redesign so only one service writes |
| Multiple writers — domains genuinely separate | Re-examine: are these the same data? Often they're not. |

### Step 4 — Choose the propagation mechanism (if federating)

| Mechanism | Latency | Reliability | Operational cost |
|---|---|---|---|
| CDC (debezium-style) | Seconds | High | Medium |
| Event streams (Kafka, etc.) | Sub-second | High | High |
| Scheduled export | Minutes–hours | Medium | Low |
| Synchronous API call on read | Real-time | Tied to source | Low (just a call) |

### Step 5 — Define consistency expectations

For each federated read, name the staleness budget:

- *"This view can be up to 30 seconds stale."*
- *"This view must reflect writes within 5 seconds."*
- *"This view does not need to reflect writes from the last hour."*

This becomes a fitness function: "Lag from writer to reader < 30s."

## Trade-Off Table

For each piece of data:

| Force | Single Owner | Data Domain | Service Consolidation |
|---|---|---|---|
| Write simplicity | High | High | High |
| Read latency | Low | High | High |
| Read availability | Tied to owner | High | High |
| Consistency | Strong | Eventual | Strong |
| Operational complexity | Low | High | Low (after merge) |
| Service boundary preservation | High | High | Low (you're merging) |

## Anti-Patterns

- **Multiple writes to the same logical record from different services**
  — see Common Ownership.
- **Synchronizing two databases in both directions** — guaranteed
  conflicts; pick one as authoritative.
- **Treating cache invalidation as data ownership** — caches drift; if
  the cache is the only place a read finds the data, the cache IS the
  owner.
- **Federation without staleness SLO** — without a budget, "eventual" is
  forever.

## Hand-Off

File ADR via
[`software-architecture:architecture-decision-records`](../../architecture-decision-records/SKILL.md).

Encode the ownership decision as fitness functions:

- "Only service X has writes to table Y" (structural / data-quality)
- "Lag from X to read replica Z < N seconds" (capacity / data-quality)
- "Service A does NOT have write access to schema B" (structural /
  security)

See [`software-architecture:architectural-fitness-functions`](../../architectural-fitness-functions/SKILL.md).
