---
name: tdd-as-architectural-discipline
description: >
  Apply Test-Driven Development as architectural discipline — the inner
  loop that supports evolutionary architecture by keeping unit-level
  refactoring safe and continuous. Use when invoking TDD in an
  architectural context (e.g., "we need to keep this evolvable"). This is
  a pointer skill — the actual TDD practice lives in
  `superpowers:test-driven-development`. Pairs with
  `software-architecture:bdd-for-architecture` (the outer loop) and
  `software-architecture:evolutionary-architecture` (the why).
status: draft
version: 1.0.0
---

# TDD as Architectural Discipline

This is a **pointer skill**. The actual Test-Driven Development practice
lives at [`superpowers:test-driven-development`](../../../superpowers/skills/test-driven-development/).
This skill exists to provide the *architectural framing* — why TDD
matters for adaptive and evolutionary architecture, and how to invoke it
from architectural skills.

## When to Invoke

Invoke `superpowers:test-driven-development` when:

- You're inside an outer-loop BDD scenario (see
  [`software-architecture:bdd-for-architecture`](../bdd-for-architecture/SKILL.md))
  and reach a unit boundary.
- You're refactoring code that lives behind an architectural fitness
  function — TDD ensures the refactor preserves behavior.
- You're implementing a Hard Parts decision at the unit level (e.g.,
  building the new service boundary identified by
  [`architectural-trade-offs`](../architectural-trade-offs/SKILL.md)).
- You're evolving a long-lived system and need confidence each small
  step preserves behavior (the evolutionary architecture mandate).

## Why TDD Belongs in Architecture

Neal Ford et al. argue in *Building Evolutionary Architectures* that
**architecture's evolvability depends on the unit-level discipline that
supports it**. A system can have great fitness functions and clean
boundaries, but if the team can't safely refactor a function inside a
service, the architecture ossifies anyway.

The chain is:

```
Evolutionary architecture (multi-dimensional change over time)
  ←─ depends on ─
Architectural fitness functions (verify characteristics)
  ←─ depends on ─
BDD scenarios (verify behavior at boundaries)
  ←─ depends on ─
TDD (verify behavior at units)
```

Skipping any link breaks the chain. TDD is the smallest link; without
it, refactoring is a guess.

## The Three Verification Layers

| Layer | Skill | Verifies | Granularity |
|---|---|---|---|
| **Inner loop (TDD)** | `superpowers:test-driven-development` | Internal correctness | Unit / function |
| **Outer loop (BDD)** | `software-architecture:bdd-for-architecture` | System behavior | Feature / scenario |
| **Architectural fitness** | `software-architecture:architectural-fitness-functions` | Architectural characteristics | System / component |

Each layer's tests are distinct artifacts with distinct lifecycles. Don't
collapse them: a "test" that verifies all three at once is hard to
debug, slow, and brittle.

## Invocation Pattern

When inside an architectural workflow and reaching a unit boundary:

> *"Switching to `superpowers:test-driven-development` for the unit-level
> work, then returning to this architectural context."*

Hand-off explicitly so the model loads the right skill content.

## What This Skill Does NOT Cover

This skill does **not** duplicate `superpowers:test-driven-development`.
Don't ask this skill for:

- TDD red-green-refactor mechanics
- How to write a unit test
- Test framework choice
- Mocking / stubbing patterns

Those live in `superpowers:test-driven-development`. This skill only
provides the architectural pointer.

## Why a Separate Skill Instead of Inline References?

Earlier versions of this plugin considered putting the architectural
framing as a paragraph inside `evolutionary-architecture` and
`bdd-for-architecture`. The reason for a separate (thin) skill:

- Activates on *its own* trigger phrases ("TDD for architecture", "inner
  loop discipline", "unit testing for evolvability").
- Provides a stable hand-off point that other skills can reference
  without including the TDD framing inline.
- Decouples this plugin from `superpowers:test-driven-development`'s
  evolution.
