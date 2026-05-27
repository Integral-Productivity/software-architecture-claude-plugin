---
name: bdd-for-architecture
description: >
  Apply Behavior-Driven Development as architectural verification at the
  system boundary — discovery workshops, example mapping, Gherkin feature
  files, and outside-in development framed as architectural fitness at the
  acceptance level. Use when defining acceptance criteria for a system or
  service, writing BDD scenarios that verify cross-component behavior, or
  treating the outer loop as an architectural test. Invoke
  `software-architecture:tdd-as-architectural-discipline` for the inner loop.
status: draft
version: 1.0.0
---

# BDD for Architecture

Behavior-Driven Development is usually framed as a *collaboration technique*
between business, dev, and QA. This skill adds an architectural framing:
**BDD scenarios are fitness functions at the system boundary.** Where unit
TDD verifies internal correctness and component fitness functions verify
architectural characteristics, BDD verifies the *behavior the architecture
must guarantee at its outer surface*.

## The Architectural Framing

| Layer | Verifies | Tool |
|---|---|---|
| **Unit (TDD)** | Internal correctness of a function/class | `superpowers:test-driven-development` |
| **Component fitness** | Architectural characteristic (modifiability, performance, …) | [`software-architecture:architectural-fitness-functions`](../architectural-fitness-functions/SKILL.md) |
| **System BDD (this skill)** | Behavior the system promises to its actors | Cucumber, playwright-bdd |

A BDD scenario like *"a customer placing an order receives confirmation
within 5 seconds"* is simultaneously a behavioral assertion AND a
performance fitness function. Treat it as both.

## BDD's Three Phases

BDD works in three phases: **Discovery** (shared understanding),
**Formalization** (Gherkin scenarios), and **Outside-In Development**
(implement from the outside in).

**BDD is the outer loop; TDD is the inner loop.** This skill handles the
outer loop. Invoke
[`software-architecture:tdd-as-architectural-discipline`](../tdd-as-architectural-discipline/SKILL.md)
when you need to design a unit's internals.

---

## Phase 1 — Discovery

Discovery exposes ambiguity and builds shared understanding *before*
writing code or scenarios.

### Three Amigos

Bring three perspectives to every feature:

- **Business** — what outcome does this feature achieve? What rules apply?
- **Developer** — how might this be implemented? What edge cases matter?
- **Tester** — how would we know it works? What could go wrong?

A 15-minute Three Amigos chat before a feature starts is worth more than
hours of re-work afterward.

### Example Mapping

| Card color | Card type | Purpose |
|---|---|---|
| Yellow | **Story** | The feature being discussed |
| Blue | **Rule** | A business rule that applies |
| Green | **Example** | A concrete scenario illustrating a rule |
| Red | **Question** | An unanswered question that blocks progress |

**Process:**
1. Write the story on a yellow card.
2. For each business rule, add a blue card.
3. For each rule, add green example cards (concrete instances, not abstractions).
4. Add red question cards for anything uncertain.

**When to stop:** Few red cards → ready for development. Many red cards →
story needs more discovery.

**Good examples:** concrete (real values), single-rule, clear outcome,
surprising / edge-case-revealing.

---

## Phase 2 — Formalization (Gherkin)

Gherkin translates concrete examples into executable specifications.

### Feature File Structure

```gherkin
Feature: <feature name — noun phrase>
  <optional description: business context, user story>

  Background:
    Given <shared precondition for all scenarios>

  Rule: <business rule — statement of fact>

    Scenario: <scenario title — outcome-focused>
      Given <system state>
      When <actor action>
      Then <observable outcome>

    Scenario Outline: <parameterized scenario title>
      Given <state with <parameter>>
      When <action with <parameter>>
      Then <outcome with <expected>>
      Examples:
        | parameter | expected |
        | value1    | result1  |
```

### Given / When / Then Grammar

**Given** — preconditions (system state before action).
- World state, not action: `Given a customer with a premium account`.

**When** — actor's action (one per scenario).
- A single, specific action. If you have multiple Whens, split scenarios.

**Then** — observable outcome.
- Assert behavior, not implementation: `Then the order confirmation email is sent`,
  not `Then the database has a row`.

**And / But** — continuation. `But` reads as contrast.

### Declarative over Imperative

**Imperative (avoid):**
```gherkin
When I navigate to "/cart"
And I click "Add to cart"
```

**Declarative (prefer):**
```gherkin
When the customer checks out with 2 items in the cart
```

Declarative scenarios survive UI changes.

### Tags

```gherkin
@smoke @regression @wip @slow
```

Agree on the tag taxonomy before the first feature file lands.

### Anti-Patterns

| Anti-pattern | Why | Fix |
|---|---|---|
| Conjunctive step | Two actions in one `When` | Split into two scenarios |
| UI leakage | `When I click the blue button` | Raise abstraction |
| Vague language | `Given a valid order` | Concrete values |
| Technical assertion | `Then the DB has a row` | Assert observable behavior |
| Scenario as tutorial | Long happy path | Split into focused scenarios |

---

## Phase 3 — Outside-In Development

Outside-in uses the failing scenario as the starting gun.

```
Failing scenario
  └─ Implement enough to reach the first failing step
       └─ Inner TDD loop (superpowers:test-driven-development)
            └─ Red unit test → green → refactor
  └─ Re-run scenario — next step fails
  └─ Repeat until scenario passes
```

After the scenario passes, refactor step definitions to remove duplication
and raise abstraction.

### Step Definition Quality

- Step definitions are glue code, not test logic.
- One concept per step definition.
- Reuse step definitions across scenarios.
- If a step definition exceeds ~10 lines, extract to a helper or page object.

---

## Cucumber.js Implementation (TypeScript reference)

See the OrgOps project for full patterns. Highlights:

- `cucumber.config.mts` with named profiles per tag set
- `setWorldConstructor` + `declare module '@cucumber/cucumber'` for typed
  `this` in step definitions
- Hooks file (`Before` / `After`) for state reset
- Built-in parameter types (`{int}`, `{string}`, `{word}`) + `DataTable`
- Fluent mock connectors with `setX().setY()` chaining

For UI E2E BDD, use [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/).

---

## Relationship to Architectural Fitness

BDD scenarios that cross multiple system boundaries (e.g., user action →
service A → service B → external integration) are simultaneously **system
integration tests** and **architectural fitness functions for the
distributed-data, sagas, and contracts archetypes**.

When a scenario crosses a service boundary, also check:

- Is the service granularity in
  [`software-architecture:architectural-trade-offs/decision-archetypes/granularity.md`](../architectural-trade-offs/decision-archetypes/granularity.md)
  consistent with the scenario's expectations?
- Does the data ownership match
  `decision-archetypes/data-ownership.md`?
- Is the saga/orchestration pattern documented and tested in
  `decision-archetypes/sagas-and-orchestration.md`?

If yes to all three, the BDD scenario IS the running architectural test.
If no, the scenario reveals a missing architectural decision — capture it
as an ADR.

## Relationship to TDD

| | BDD (this skill) | TDD |
|---|---|---|
| Loop | Outer | Inner |
| Granularity | Feature / behavior | Unit / function |
| Language | Domain language (Gherkin) | Code language |
| Audience | Business + dev + QA | Developers |
| Purpose | Define *what* to build | Define *how* |

Run BDD first. When a scenario step takes you to a unit boundary, invoke
`software-architecture:tdd-as-architectural-discipline` (which points at
`superpowers:test-driven-development`).
