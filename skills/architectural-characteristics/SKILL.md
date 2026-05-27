---
name: architectural-characteristics
description: >
  Elicit and prioritize architectural characteristics — the "-ilities"
  (modifiability, scalability, resilience, observability, security, cost,
  performance, etc.) that an architecture must preserve. Use when starting
  a new system, evaluating an existing architecture, framing a Hard Parts
  trade-off, or running stakeholder elicitation. Pairs with
  `software-architecture:architectural-fitness-functions` (which turns each
  selected characteristic into an executable test).
status: draft
version: 1.0.0
---

# Architectural Characteristics

Neal Ford's *Fundamentals of Software Architecture* (2nd ed., chs 4–5)
defines architectural characteristics as **the non-functional requirements
the architecture must support**. They are the dominant force behind
architectural decisions. This skill teaches the elicitation and
prioritization practice.

> **Rule of thumb (Ford):** No architecture can be best at every
> characteristic. Pick the top 3–7 the architecture must explicitly
> support; everything else is implicit or accepted as weaker.

## What Is and Isn't a Characteristic

A characteristic is:
- **Non-domain** — not "supports invoicing"; that's a feature
- **Cross-cutting** — affects multiple components
- **Measurable** (eventually) — even if the measurement isn't built yet
- **Trade-off-bearing** — improving it costs effort elsewhere

A characteristic is NOT:
- A feature ("user can export to PDF")
- A technology choice ("uses PostgreSQL")
- A measurement target without context ("p99 < 100ms" without saying why)

## The Catalog (selected)

Ford organizes characteristics in three broad groups. The full catalog is
long; this is the working subset most projects need.

### Operational
| Characteristic | Question it answers |
|---|---|
| **Availability** | What fraction of time is the system usable? |
| **Performance** | How fast does it respond / how much throughput? |
| **Reliability** | How often does it fail unrecoverably? |
| **Recoverability** | How fast can it come back? |
| **Scalability** | How well does it absorb load? |
| **Robustness** | How does it behave under adverse conditions? |
| **Elasticity** | How quickly does capacity adapt to load changes? |

### Structural
| Characteristic | Question it answers |
|---|---|
| **Modifiability / Maintainability** | How easy to change? |
| **Extensibility** | How easy to add new features? |
| **Modularity** | How well-separated are concerns? |
| **Deployability** | How easy to release? |
| **Testability** | How easy to verify behavior? |
| **Configurability** | How much can users / ops adjust? |
| **Portability** | How easy to move to another platform? |

### Cross-Cutting
| Characteristic | Question it answers |
|---|---|
| **Security** | How well does it resist misuse? |
| **Auditability** | Can we reconstruct who did what when? |
| **Privacy** | Are personal-data flows controlled? |
| **Observability** | Can we tell what's happening inside? |
| **Cost** | What does it cost to operate? |
| **Sustainability** | What's the environmental footprint? |
| **Accessibility** | Is it usable by people with disabilities? |
| **Compliance** | Does it meet regulatory requirements? |

## Elicitation Process

### Step 1 — Listen for implicit characteristics

In stakeholder conversations, watch for phrases like:
- "must be fast" → **performance**
- "should handle spikes" → **scalability** / **elasticity**
- "we'll need to add X later" → **extensibility**
- "must never lose data" → **reliability** / **durability**
- "audited quarterly" → **auditability** / **compliance**
- "can't afford downtime" → **availability**

Convert each implicit phrase into a candidate characteristic.

### Step 2 — Translate business goals to characteristics

| Business goal | Likely characteristics |
|---|---|
| Acquire new customers fast | **performance** (page load), **scalability** (signup surges) |
| Reduce ops burden | **reliability**, **observability**, **deployability** |
| Comply with regulation | **auditability**, **security**, **privacy** |
| Enter new markets | **portability**, **modifiability**, **deployability** |
| Build platform for partners | **stability of contracts**, **extensibility** |
| Reduce cost | **cost** (explicitly), **elasticity** (right-size to load) |

### Step 3 — Force a prioritization

You **cannot** have all characteristics at maximum. Force the team to
nominate **3 (firm) + 4 (soft)** = top 7 max.

Common conflict pairs (improving one degrades the other):

| Pair | Conflict |
|---|---|
| Performance ↔ Security | Encryption / auth adds latency |
| Performance ↔ Scalability | Optimal per-request work vs. horizontal expansion |
| Availability ↔ Consistency | CAP theorem |
| Modifiability ↔ Performance | Abstraction layers add cost |
| Simplicity ↔ Extensibility | Plug points add complexity |
| Cost ↔ Performance / Availability | Cheap = slower or less redundant |

Each top-7 choice should be defended against the conflicts above.

### Step 4 — Define measurement

Every selected characteristic needs an *eventual* measurement, even if
deferred:

| Characteristic | Measurement (example) |
|---|---|
| Performance | p99 latency < 200ms for the 5 core endpoints |
| Availability | 99.9% monthly uptime SLA on read paths |
| Modifiability | New integration < 200 LOC, < 1 day |
| Scalability | Handles 10× current load with linear cost |
| Observability | Every request's journey reconstructable from traces |

Without a measurement, the characteristic is aspirational. With one, it
becomes a candidate fitness function.

### Step 5 — Hand off to fitness functions

For each top-7 characteristic with a measurement, file a candidate fitness
function — see
[`software-architecture:architectural-fitness-functions`](../architectural-fitness-functions/SKILL.md).

The characteristic is *what* matters; the fitness function is *how we
know* it's still true as the system evolves.

## Output Artifacts

Running this skill produces:

1. **Characteristics worksheet** — top-7 with rationale, conflict
   acknowledgements, measurements.
2. **Candidate fitness functions** — one per measurable characteristic.
3. **An ADR** capturing the prioritization (it IS an architectural
   decision; treat it like one).

The ADR should live at the appropriate level per
[`software-architecture:architecture-governance-levels`](../architecture-governance-levels/SKILL.md)
— usually System level (`<product>/docs/adr/`).

## Anti-Patterns

- **All characteristics matter equally** — pick or lose.
- **"It must just be fast / scalable / secure"** — no number = no
  measurement = no fitness function = not chosen.
- **Picking characteristics without business goals** — characteristics
  serve goals; if you can't trace a characteristic back to a goal, why
  is it on the list?
- **Treating characteristics as static** — they shift over time. Revisit
  yearly, or when the business goals shift.

## Continuous Re-Evaluation

Characteristics are not set once. Schedule re-evaluation:
- When entering a new market (likely changes portability / compliance).
- When scaling 10× (likely changes scalability / cost / observability).
- When a major incident exposes a gap (likely changes resilience /
  recoverability / observability).

Each re-evaluation that changes priorities → new ADR superseding the old.
