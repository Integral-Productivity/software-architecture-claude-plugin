# Contracts and Evolution Archetype

> Source: *Software Architecture: The Hard Parts*, ch. 13 (contracts in
> distributed architectures).

The contract question: **"How do we evolve the API between X and Y?"**

Equivalent framings:
- How do we ship a breaking change?
- Should we version the API? How?
- Tight contracts or loose contracts?
- Schema-first or code-first?

## What Is a Contract

A contract is the agreed-upon shape of communication between two
components. It can be explicit (schema, IDL) or implicit (REST URL +
JSON conventions). Implicit contracts are still contracts — they're just
contracts you'll discover by breaking.

Hard Parts identifies four kinds:

| Type | Examples | Tightness |
|---|---|---|
| **Strict** | Protobuf, Avro, GraphQL with strict schema | Tightest |
| **Loose** | REST + JSON, untyped event payload | Medium |
| **Hyperlinked / discoverable** | HATEOAS, OData | Loose, declarative |
| **Inferred** | "Here's the JSON; figure it out" | Loosest (and brittle) |

## Tight vs Loose Contracts

This is the core trade-off.

### Tight contracts (strict schema)

**Pros:**
- Breaks are caught at build / deploy time, not in production.
- Both sides know exactly what's allowed.
- Tooling can generate stubs, clients, mocks.

**Cons:**
- Every change requires coordinated deploys (or careful versioning).
- Adds friction to early-stage evolution.
- Schema becomes a coupling surface.

### Loose contracts (REST + JSON conventions)

**Pros:**
- Either side can evolve faster.
- Easier to bootstrap.
- Tolerant readers can handle additive changes silently.

**Cons:**
- Bugs surface at runtime, in production.
- Two services can drift without noticing until traffic patterns shift.
- Implicit conventions become institutional knowledge.

## Postel's Law and Its Limits

> "Be conservative in what you send, liberal in what you accept."

This is the foundational principle for loose contracts. It supports
**tolerant readers** — clients ignore unknown fields, fail open on
missing optional fields. Hard Parts treats this as a guideline, not a
panacea — at scale, loose acceptance hides drift that eventually causes
incidents.

## Contract Evolution Strategies

### 1. Backwards-compatible additive

Add a new optional field. Old clients ignore it. New clients use it.

**Works when:** the change is purely additive AND optional.

### 2. Versioned API

Multiple versions co-exist. URL or header carries the version. Old
versions deprecated on schedule.

**Works when:** you can run multiple versions side-by-side. Cost: every
backend feature is implemented N times.

### 3. Expand-and-contract (schema migration)

Phase 1: Old field + new field both present, writes go to both.
Phase 2: Readers switch to new field.
Phase 3: Writers stop writing the old field.
Phase 4: Remove the old field.

**Works when:** you control both sides of the contract; willing to plan
multi-step migration. Used heavily in database refactoring (Pramod
Sadalage).

### 4. Strangler fig (for the whole interface)

Stand up a new contract alongside the old. Route traffic gradually. When
new covers 100%, retire old.

**Works when:** the contract change is large enough that field-by-field
isn't viable.

## Decision Process

### Step 1 — Classify the contract

- Is it internal (between your services) or external (third parties,
  partners, customers)?
- Is it sync (request/response) or async (events / streams)?

| Internal | External |
|---|---|
| Can move tighter / faster | Must move slower; users break |

| Sync | Async |
|---|---|
| Version per request | Version per event schema |

### Step 2 — Determine the evolvability budget

How often will this contract need to change? How fast?

| Change frequency | Implies |
|---|---|
| Monthly+ | Lean toward looser contracts OR strong tooling for tight ones |
| Quarterly | Tight + versioned is workable |
| Yearly | Strict contracts are fine |
| Never | Strict; treat as platform |

### Step 3 — Identify the consumers

| Consumer count | Implies |
|---|---|
| 1 | Coordinate; tightest contract is fine |
| 2–5 | Versioning helps |
| Many internal | Expand-and-contract; backward compatibility matters |
| External (partner / customer) | Versioning is mandatory; deprecation schedules |

### Step 4 — Pick the strategy

| Situation | Strategy |
|---|---|
| Internal, sync, < 5 consumers | Tolerant readers + additive |
| Internal, async (events), many consumers | Schema + backwards-compatible additive |
| Internal, breaking change needed | Expand-and-contract |
| External, breaking change needed | Versioned + deprecation schedule |
| Major redesign | Strangler fig |

### Step 5 — Define what "breaking" means

Be explicit:

| Type | Breaking? |
|---|---|
| Add optional field | No |
| Add required field | Yes |
| Remove field (anyone uses it) | Yes |
| Change field type | Yes |
| Rename field | Yes (treat as remove + add) |
| Loosen constraint (e.g., max length increases) | No |
| Tighten constraint (e.g., max length decreases) | Yes |
| Add value to enum (clients tolerant?) | Maybe |

## Trade-Off Table

For a given evolution choice:

| Force | Tight + version | Tight + expand-contract | Loose + tolerant |
|---|---|---|---|
| Breakage caught at build time | Yes | Yes | No |
| Speed of evolution | Slow | Medium | Fast |
| Multi-consumer support | High | High | Medium |
| Operational complexity | Medium | High | Low |
| Long-tail consumer migration | Forced via deprecation | Smooth | Best-effort |
| Required tooling | High | High | Low |

## Anti-Patterns

- **Renaming without expand-and-contract.** Every consumer breaks
  simultaneously.
- **No deprecation schedule for external APIs.** Versions accumulate
  forever; cost grows without bound.
- **Treating events as ephemeral.** Event consumers exist for years;
  event schemas are forever.
- **Backward compatibility forever.** Sometimes you must break things.
  Plan it; communicate it; don't avoid it indefinitely.

## Hand-Off

File ADR via
[`software-architecture:architecture-decision-records`](../../architecture-decision-records/SKILL.md).

Encode the contract decision as fitness functions:

- "Every API change passes the contract-test suite" (behavioral)
- "Schema registry has no incompatible versions in active use"
  (capacity / governance)
- "Deprecated endpoints return `Sunset` header" (structural)

See [`software-architecture:architectural-fitness-functions`](../../architectural-fitness-functions/SKILL.md).
