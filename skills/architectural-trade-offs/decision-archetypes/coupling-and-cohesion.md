# Coupling and Cohesion Archetype

> Source: *Software Architecture: The Hard Parts*, chs 2 + 8 (coupling
> analysis), and *Fundamentals of Software Architecture* (modularity).

The coupling question: **"How tightly should X and Y connect?"**

Equivalent framings:
- Should A call B synchronously or asynchronously?
- Should A and B share data, or should each own its copy?
- Should A know about B's internals or only its contract?
- Is this coupling intentional or accidental?

## Static vs Dynamic Coupling

Hard Parts distinguishes two kinds of coupling:

### Static coupling
*How things are wired together at definition / deploy time.*

Examples: package imports, shared libraries, shared databases, build-time
dependencies.

Measured by: dependency graphs, fan-in / fan-out, layering rules.

### Dynamic coupling
*How things interact at runtime.*

Examples: sync vs. async calls, request/response vs. event, blocking vs.
non-blocking, contract granularity.

Measured by: call traces, request volume between services, error
propagation.

Both matter. Two services can have low static coupling (no shared code)
but high dynamic coupling (they chat constantly at runtime), or
vice-versa.

## Three Dimensions of Dynamic Coupling

For each integration between two services, classify on three axes:

### 1. Communication
- **Synchronous** — caller waits for response. Lower latency overhead,
  but cascading failure risk.
- **Asynchronous** — caller fires and forgets (or polls). Decoupled in
  time; needs idempotency.

### 2. Consistency
- **Atomic** — both sides commit together (distributed transactions /
  sagas).
- **Eventual** — sides converge over time; intermediate states are
  visible.

### 3. Coordination
- **Orchestrated** — a central component drives the flow.
- **Choreographed** — each component reacts to events without a central
  driver.

The 8 combinations of these three axes are the **architectural quanta**
of integration. Most are valid; each has its trade-offs. (Hard Parts ch.
2 lays this out in detail.)

| Communication | Consistency | Coordination | Common pattern |
|---|---|---|---|
| Sync | Atomic | Orchestrated | Distributed monolith / service-call chain |
| Sync | Eventual | Orchestrated | Request-response with retries |
| Async | Atomic | Orchestrated | Workflow engine with transaction guarantees |
| Async | Eventual | Choreographed | Event-driven (microservices) |
| Sync | Atomic | Choreographed | Rare; usually accidental |
| Sync | Eventual | Choreographed | Some pub-sub-with-callback patterns |
| Async | Atomic | Choreographed | Saga with compensations |
| Async | Eventual | Orchestrated | Orchestrated saga |

## Coupling Smells

Signals that current coupling is wrong:

| Smell | Likely cause | Fix |
|---|---|---|
| Cascading failures (A down → B down) | Sync where async would work | Move to async + queue |
| Chatty integration (N calls per workflow step) | Wrong granularity OR contract too narrow | Coarser-grained contract; consider merge |
| Frequent breaking changes affect both sides | Shared internal model | Introduce anti-corruption layer / Published Language |
| Deploys must be coordinated | Static coupling via shared library | Version the library; consume by version |
| Latency dominated by network hops | Sync over too many services | Re-evaluate granularity (see `granularity.md`) |

## Cohesion: the inverse force

If coupling is "stuff between modules," cohesion is "stuff inside a
module." High cohesion = the module's parts work toward one purpose.

| Cohesion type | Strength |
|---|---|
| **Functional** — all parts serve one task | Strongest |
| **Sequential** — output of one feeds the next | Strong |
| **Communicational** — parts operate on same data | Moderate |
| **Procedural** — parts run in a certain order | Weak |
| **Temporal** — parts run at the same time | Weak |
| **Logical** — parts are categorized similarly | Weakest |

Aim for functional / sequential cohesion. Modules with logical or
temporal cohesion are usually candidates for splitting.

The trade-off: **maximum cohesion + minimum coupling = pure modularity**,
but pure modularity is itself a cost (more modules to manage, more cross-
module wiring). Find the right modularity *for this system's
characteristics*.

## Trade-Off Table

For each integration in question:

| Dimension | Option A (e.g., sync) | Option B (e.g., async) |
|---|---|---|
| Latency | Lower (no queue) | Higher (queue hop) |
| Resilience | Lower (cascading failure) | Higher (decoupled in time) |
| Operational complexity | Lower (no queue infra) | Higher (queue infra, monitoring) |
| Idempotency requirements | Lower (single delivery) | Higher (at-least-once) |
| Debuggability | Higher (linear trace) | Lower (correlation across hops) |
| Development cost | Lower | Higher (more infra) |

## Hand-Off

File ADR via
[`software-architecture:architecture-decision-records`](../../architecture-decision-records/SKILL.md).

Encode the coupling decision as fitness functions:

- "Service X's outbound calls to Service Y are async (no sync code paths)"
- "No code in X imports Y's internal modules; only Y's public contract"

See [`software-architecture:architectural-fitness-functions`](../../architectural-fitness-functions/SKILL.md).
