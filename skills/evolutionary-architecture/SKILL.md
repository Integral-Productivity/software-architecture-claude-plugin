---
name: evolutionary-architecture
description: >
  Apply evolutionary architecture — designing systems to support
  incremental, guided change across multiple dimensions. Use when planning
  long-lived system evolution, deciding whether to refactor or rewrite,
  designing for "architecture is a hypothesis," establishing continuous
  architectural verification, or migrating between architectural styles.
  Pairs tightly with
  `software-architecture:architectural-fitness-functions`.
status: draft
version: 1.0.0
---

# Evolutionary Architecture

From Ford, Parsons, and Kua, *Building Evolutionary Architectures*:

> **An evolutionary architecture supports guided, incremental change
> across multiple dimensions.**

The three load-bearing words:

- **Guided** — change is steered by fitness functions, not luck.
- **Incremental** — small, frequent moves, each protected by fitness.
- **Multiple dimensions** — not just code; data, security, ops, integration.

This skill makes the philosophy operational. Pairs tightly with
[`software-architecture:architectural-fitness-functions`](../architectural-fitness-functions/SKILL.md)
(the *mechanism*) and
[`software-architecture:architectural-characteristics`](../architectural-characteristics/SKILL.md)
(the *what to protect*).

## Architecture Is a Hypothesis

The historical assumption: architecture is *static* — designed once,
optimized, then preserved. Reality: every architecture meets stress it
wasn't designed for. The choice is between:

- **Brittle architecture** — assumes the original assumptions hold; breaks
  loudly when they don't.
- **Evolutionary architecture** — assumes assumptions will change; builds
  in the apparatus to detect drift and absorb change.

Treat every architectural choice as a hypothesis. Fitness functions are
the running experiments that test whether the hypothesis still holds.

## The Three-Step Operational Loop

For any system you intend to evolve:

1. **Select dimensions** — name the 3–7 characteristics that matter (see
   [`architectural-characteristics`](../architectural-characteristics/SKILL.md)).
2. **Encode as fitness functions** — write executable checks for each
   characteristic (see
   [`architectural-fitness-functions`](../architectural-fitness-functions/SKILL.md)).
3. **Run continuously** — fitness checks run on every PR, every deploy,
   every architecture change. Failures gate.

Repeat. Characteristics shift; fitness functions shift with them.

## Dimensions to Track

Ford et al. emphasize that "architecture" is multi-dimensional. Don't
limit fitness to *code shape*.

| Dimension | What to verify | Example fitness |
|---|---|---|
| **Technical** | Source-file structure, module boundaries | "No code outside the adapter layer imports vendor SDKs" |
| **Data** | Schema invariants, ownership, retention | "No two services write the same column" |
| **Security** | Threat surface, authn/authz boundaries | "Every public endpoint has auth middleware" |
| **Operations** | Deployment, observability, ops cost | "Every service has health + metric endpoints" |
| **Process** | Velocity, lead time, change failure rate | DORA metrics as fitness over time |
| **Cost** | Per-service cloud spend | "No service exceeds $X/month without an ADR" |

Each dimension can drift independently. A system can be technically clean
but operationally fragile, or secure but expensive. Multi-dimensional
fitness catches what single-dimensional review misses.

## Atomic vs. Holistic Fitness

**Atomic** fitness checks one characteristic in isolation. Easy to debug,
easy to interpret.

**Holistic** fitness checks emergent behavior across characteristics —
e.g., "load test scenario X completes in < 5s AND every event has a
correlation id AND no PII appears in logs." Hard to debug, but the only
way to verify some properties (especially distributed-systems ones).

Use both. Prefer atomic; reach for holistic when the property is genuinely
emergent.

## Triggered vs. Continuous Fitness

| Mode | Runs | Suitable for |
|---|---|---|
| **Triggered** | On commit / PR / merge | Structural checks, fast unit-style fitness |
| **Continuous** | Always-on monitoring | Performance SLOs, error budgets, capacity |
| **Periodic** | Scheduled (nightly, weekly) | Expensive checks (full load tests, security scans) |

Don't run everything in CI — long-running checks belong in periodic or
continuous modes. The plugin's `/software-architecture:fitness` command
asks which mode is right for each new function.

## Incremental Change Patterns

### Strangler Fig

Wrap the old system; route some traffic to the new; gradually expand the
new's coverage. Each routing change is a small, verified step.

Fitness function: every endpoint either routes to new XOR old, never
both. (Ambiguity in the routing table is the failure mode.)

### Parallel Run

Run old and new side-by-side, compare outputs, ramp traffic when diffs
shrink to acceptable noise.

Fitness function: a "diff alarm" runs against production traffic; > N%
divergence fails.

### Feature Flag–Gated Refactor

Behind a flag, switch implementation; verify behaviorally; remove the old.

Fitness function: every flag has an "expiration date" — flags older than
N months fail fitness.

### Database Refactoring (Pramod Sadalage)

Schema evolution as small, additive, deployable migrations. Each
migration is a step; old + new can coexist during transitions.

Fitness function: no migration that drops a column without first checking
read-side coverage.

## When NOT to Evolve

Evolutionary architecture is not always right.

- **Throwaway code** — a one-off script, a demo, a hackathon project. The
  apparatus costs more than the system is worth.
- **Stable, short-lived systems** — a compliance form. It will be
  superseded before evolution matters.
- **Externally constrained systems** — a system locked to a vendor's API
  shape. You can't evolve what you don't own.

The rule of thumb: if you expect the system to live > 18 months and to
change > monthly, build evolutionary apparatus.

## Anti-Patterns

- **Big-bang rewrites** — the opposite of evolutionary. By the time the
  rewrite ships, requirements have moved.
- **Fitness theater** — checks that always pass; provide no signal.
  Periodically check that fitness functions have *ever* caught a regression.
- **Architecture as static doc** — drawing the diagram and forgetting it.
  The fitness suite IS the live architecture document.
- **Coupling fitness to a single CI** — if fitness lives only in CI, it
  doesn't run during exploration. Make fitness runnable locally
  (`make fitness`, `pnpm fitness`).

## Connection to Hard Parts

The Hard Parts trade-off archetypes (see
[`software-architecture:architectural-trade-offs`](../architectural-trade-offs/SKILL.md))
each have a "how would evolution stress this?" lens:

| Archetype | Evolution stress |
|---|---|
| Granularity | Will service size be right at 10× scale? |
| Coupling | Will current couplings hold under new integrations? |
| Data ownership | Will ownership boundaries survive new write paths? |
| Sagas | Will the saga work when a step is replaced or removed? |
| Contracts | Will current contracts accept new versions without breaking? |

Each Hard Parts ADR should answer the evolution-stress question. If the
answer is "we don't know," that's a candidate fitness function.

## Tooling

- **Static fitness:** ArchUnit (Java), ts-arch / dependency-cruiser (TS),
  pytest-arch (Python), or hand-rolled checks reading the file system.
- **Behavioral fitness:** Contract tests (Pact), property-based tests
  (fast-check / hypothesis), saga simulators.
- **Dynamic fitness:** k6 / Locust for load, Chaos toolkit for resilience.

Choose the lightest tool that gives a clear signal.
