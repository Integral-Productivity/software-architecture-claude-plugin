---
name: architectural-fitness-functions
description: >
  Guide architecture-as-code practice — designing fitness functions, encoding
  architectural characteristics as executable checks, preventing drift. Use
  when designing a new component or integration, evaluating quality
  attributes (performance, resilience, modifiability, observability), or
  interpreting fitness check failures. Trigger even when no code exists yet
  — the design phase is where architectural characteristics get turned into
  fitness functions. Pairs with `software-architecture:evolutionary-architecture`.
status: draft
version: 1.0.0
---

# Architectural Fitness Functions

Architecture fitness functions are executable tests of **architectural
characteristics** — the *-ilities* (modifiability, resilience, performance,
observability, security, cost) — that you want the architecture to preserve
as it changes. The methodology is Neal Ford's *Building Evolutionary
Architectures* tradition.

This skill is framework-agnostic; it applies the methodology to any codebase
or toolchain. A typical worked example is a TypeScript fitness check run with
`node:test` (e.g. a `fitness/adr-format.ts` that asserts every ADR matches the
expected template); the same pattern translates to a Python `scripts/fitness/`
check or any test runner.

For characteristics elicitation (the *what* before the *test*), see
[`software-architecture:architectural-characteristics`](../architectural-characteristics/SKILL.md).
For continuous architectural verification over time, see
[`software-architecture:evolutionary-architecture`](../evolutionary-architecture/SKILL.md).

## The Prime Directive: Spec First

**Before changing any architecture, update the spec.**

1. Edit the spec to reflect the intended state.
2. Run fitness checks — they tell you which source files no longer match.
3. Update the source files to match.
4. Run all checks to confirm green.

Never update source code first and then try to reconcile the spec. The spec
is the authoritative description of intent; code is its implementation.

## Designing the Spec

Before writing any spec entry, ask: *what must stay true as this system
evolves?*

The spec's job is to prevent drift in the properties you care about. Those
properties are architectural characteristics. The generative move is to
frame each one as a trade-off question and turn the answer into a fitness
function.

### Discovery Questions by Characteristic

Work through the ones that apply to the change in front of you. Each
productive answer becomes a candidate fitness function.

**Modifiability / adaptability**
- *"How easy should it be to swap out X?"* — drives abstraction-boundary
  checks (e.g., no code outside the adapter layer imports a vendor SDK
  directly).
- *"What would it cost to add a new integration?"* — drives
  integration-surface checks.

**Resilience**
- *"What happens when service X is down for 30 minutes?"* — drives retry /
  backoff assertions.
- *"What happens if the same event fires twice?"* — drives idempotency
  invariants.

**Performance**
- *"Are we approaching a duration threshold?"* — drives p99 latency checks.
- *"Where does throughput break down first?"* — names the critical-path
  component and makes its SLO a fitness function.

**Observability**
- *"If this silently broke, how would we know?"* — drives trace-presence
  checks and log invariants.
- *"Can we reconstruct any event's journey from traces alone?"* — drives
  metadata completeness checks.

**Cost**
- *"At what volume do service costs become a problem?"* — drives checks on
  monthly invocation counts or token budgets.

**Security / data handling**
- *"What sensitive data flows through which stages, and where should it be
  redacted?"* — drives structural checks that sensitive fields are masked
  in traces and logs.

**Data modeling / placement**
- *"Where does this data belong?"* — each store has different cost, latency,
  cardinality, and durability characteristics.
- *"What's the cardinality and lifetime of this data?"* — high-cardinality
  short-lived data usually belongs in a cache or secondary store.

**Platform constraints**
- *"What platform limits does this design depend on?"* — API rate limits,
  record count limits, step count limits. Each limit must be named in the spec.
- *"How close are we to any of them?"* — becomes a capacity check with
  warn-at-75% / fail-at-90% thresholds.

### Three Outcomes for Every Concern

Every productive architectural concern must resolve to exactly one of:

1. **An automatable check** — add it to spec + checks in this session.
2. **A declared gap** — encode with a `skip` result and a reason string.
   Declared gaps are visible every time fitness runs — promises to self,
   not forgetting.
3. **An explicit deferral** — document under "Known gaps" with a trigger
   for when to revisit (e.g., *"add when volume exceeds 100 events/week"*).

Never leave an architectural concern as vague worry. That's where drift starts.

## Fitness Function Anatomy

A fitness function is an executable check with:

- **id** — unique dot-separated identifier, e.g. `static.import-boundary`
- **category** — one of: `structural`, `behavioral`, `integration`,
  `data-quality`, `observability`, `adaptability`, `performance`,
  `resilience`, `cost`, `security`, `capacity`
- **kind** — `static` (reads source files, no credentials) or `dynamic`
  (calls live APIs, skips when credentials absent)
- **run** — async function returning `pass`, `fail`, or `skip`

### Atomic vs. Holistic

Prefer **atomic** fitness functions — one characteristic per check. A check
that couples "is the step named correctly AND does it complete in < 5s"
will fail ambiguously and be annoying to debug.

Occasionally a **holistic** check measuring emergent behavior across multiple
characteristics is worth having. Flag these in the id
(e.g., `holistic.load-idempotency-observability`) so readers know what
they're reading.

### Kinds

- **Static** — reads source files at disk. Always available; suitable for
  CI and pre-commit. No credentials required.
- **Dynamic** — calls live APIs. Skips (does not fail) when credentials are
  absent. Returns real-world verification.

## Categories Taxonomy

| Category | What it checks |
|----------|---------------|
| `structural` | Source file shape — imports, exports, naming conventions |
| `behavioral` | Logic invariants — idempotency, state transitions |
| `integration` | Wiring — routes, event names, step names in source |
| `data-quality` | Data rules over real records (dynamic) |
| `observability` | Trace presence, log invariants, metadata completeness |
| `adaptability` | Abstraction boundaries, swap cost, extension surface |
| `performance` | Latency assertions, throughput thresholds (dynamic) |
| `resilience` | Retry, backoff, failure mode checks |
| `cost` | Usage counts, budget thresholds (dynamic) |
| `security` | PII masking, access boundary checks |
| `capacity` | Headroom against platform limits (dynamic) |

Extend categories when they earn their place. Don't stretch existing labels
past their meaning.

## Platform Constraints as Architecture

When the platform imposes limits, those limits **are** architectural
characteristics. A service with a 100-step cap is not a "limitation" you
work around — it's a boundary the architecture must respect.

Pattern: name the limit as a spec constant → write a capacity check with
warn-at-75% / fail-at-90% thresholds → declare the degradation strategy in
an ADR → re-evaluate when the platform changes.

## Relationship to ADRs

The spec encodes *what* the system must look like. ADRs record *why* it
was designed that way.

When making an architectural decision surfaced by the discovery questions
above, capture it as an ADR (see
[`software-architecture:architecture-decision-records`](../architecture-decision-records/SKILL.md)).
When a fitness check encodes a non-obvious rule, add an ADR reference
comment in the fitness file.

## Managing Declared Gaps

- Encode with a `skip` result and a human-readable reason string.
- List in the project's architecture fitness doc under "Known gaps" with a
  trigger for when to close them.
- On every fitness run, the `skip` shows up — the gap is never forgotten,
  just deferred.

## Evolving the Spec

Renames, moves, and deletions are highest-risk because the spec and source
can fall out of sync silently. The safe sequence:

1. **Update the spec first** to the new name / shape.
2. **Run static checks** — every place the old name still exists in source
   shows up as a failure. Use the failure list as your work list.
3. **Update source** to match. Re-run until green.
4. **For live state** (external service configurations), do the external
   change before the code deploy, or guard with a feature flag. Dynamic
   checks will flap during the transition — that's the system working.

## Authoring with the Agent

The `fitness-author` agent (dispatched by `/software-architecture:fitness`)
scaffolds new fitness functions in a worktree, matching the repo's existing
style. It studies existing `fitness/` patterns first; only invents new
patterns if none exist.
