---
name: architecture-governance-levels
description: >
  Map architectural decisions to the right level of governance — Enterprise,
  Platform, System, Service, or Code. Use when asking "where should this
  ADR live," "which repo owns this decision," "we have multiple repos and
  need to figure out who decides what," or when setting up architecture
  practice in a new repo or organization. Combines this plugin's 5-level
  governance topology with Simon Brown's C4 model. Powers the
  `/software-architecture:context` interview.
status: draft
version: 1.0.0
---

# Architecture Governance Levels

Every architectural decision lives at some *level* of the organization.
The level determines:

- Which repo's `docs/adr/` is the right home
- Who has authority to decide
- Who needs to be informed
- How the decision propagates downward

This skill defines the model. The `/software-architecture:context`
command runs an interactive interview that maps these levels onto your
specific org, producing an `ARCHITECTURE.md` for the repo.

## The Five Levels

| Level | Scope | Typical home (example) |
|---|---|---|
| **Enterprise / Cross-Cutting** | Org-wide standards, tech radar, language defaults, governance | a shared standards repo, e.g. `<your-org>/architecture-standards/docs/adr/` — pick a prefix like `ARCH-` |
| **Platform / Cross-System** | CI/CD, DevOps, shared infrastructure, security baselines | a platform/DevOps repo, e.g. `<your-org>/platform/docs/adr/` — pick a prefix like `PLAT-` |
| **System / Solution** | A product's overall architecture | Product repo's own `docs/adr/` |
| **Service / Component** | Internal structure of one bounded context | Inside the service directory |
| **Code** | Module boundaries, packages, naming | Reflected in the code structure; rarely ADR'd |

> The repo paths and prefixes above are *placeholders*. The
> `/software-architecture:context` interview captures your org's real
> routing into `ARCHITECTURE.md` — that file, not this table, is the
> source of truth.

Higher levels constrain lower levels. An Enterprise decision (e.g., "use
TypeScript by default") constrains all System decisions. A System
decision (e.g., "this service uses event-driven architecture")
constrains all Service decisions within it.

## Mapping to C4 (Simon Brown)

Simon Brown's [C4 model](https://c4model.com) is a complementary
abstraction — C4 is for *describing* architecture (diagramming); this
skill's 5 levels are for *governing* it.

| Governance Level | C4 Level | Note |
|---|---|---|
| Enterprise / Cross-Cutting | *(above C4)* | C4 starts at the system; org-wide governance lives above |
| Platform / Cross-System | C0 System Landscape | Multi-system interactions; the landscape view |
| System / Solution | C1 Context + C2 Container | The whole product and its containers |
| Service / Component | C2 Container + C3 Component | A service *is* a container; its parts are C3 components |
| Code | C4 Code | Module / class structure |

Use both axes:
- **Governance levels** answer *"where does this decision live, and who
  decides?"*
- **C4 levels** answer *"how do we draw and explain this?"*

## Where Decisions Live

### Enterprise / Cross-Cutting

**Authority:** Org-wide (whoever owns cross-cutting standards).
**Examples:**
- "TypeScript is our default language"
- "Claude is our primary AI platform"
- "Cross-product MCP patterns"
- Technology Radar ring assignments

**Smells that you're at this level:**
- The decision applies to multiple products.
- It would surprise a future contributor to find different products
  doing this differently without justification.
- Changing it requires coordinated work across multiple teams.

### Platform / Cross-System

**Authority:** Platform / DevOps team.
**Examples:**
- CI tier structure
- GitHub Actions reusable workflows
- Branch protection rules
- Auto-merge policy

**Smells that you're at this level:**
- The decision is about *how we ship*, not *what we ship*.
- It affects build/deploy/release pipeline.
- It involves cross-cutting infrastructure (logging, secrets, IAM).

### System / Solution

**Authority:** Product owner / tech lead.
**Examples:**
- A product's choice of architectural style (microservices vs monolith)
- A product's data model and write paths
- A product's authentication strategy

**Smells that you're at this level:**
- The decision is specific to one product but affects multiple services
  within it.
- Other products would reasonably make a different choice.

### Service / Component

**Authority:** Service team / individual maintainer.
**Examples:**
- Internal module structure
- Choice of in-process libraries
- Caching strategy for this service

**Smells that you're at this level:**
- The decision is invisible from outside the service.
- A future maintainer of this service needs to know; nobody else does.

### Code

**Rarely ADR'd.** Code-level decisions live in code review, in
conventions, in linter rules. ADRs at this level are usually
overkill — *unless* the convention is non-obvious enough that a future
reader would wonder why.

## Mis-Routing Smells

Decisions land at the wrong level when:

- **A System decision is documented at Enterprise level** — over-reach;
  imposes one product's choice on others.
- **A Cross-Cutting decision is documented at System level** — drift;
  multiple products solve the same problem inconsistently.
- **A Service decision is documented at System level** — clutter; the
  product-level ADR list becomes hard to navigate.
- **A decision has NO home** — the most dangerous case; the decision
  exists implicitly and changes silently.

## Setup: the `/software-architecture:context` Command

When the plugin is first used in a repo (or when an org's structure
changes), run:

```
/software-architecture:context
```

The command walks through:

1. What level of org are you operating at? (Solo / team / multi-team /
   multi-product)
2. For each level present, where do decisions live (path, prefix
   convention)?
3. Are there gaps? (e.g., no Platform repo yet — note this and offer a
   bootstrap.)
4. Are there cross-references (e.g., this product's ADRs reference
   enterprise-level decisions)?

Output: `ARCHITECTURE.md` at the repo root containing:

- The routing table customized for this org
- C4 stubs (Context, Container, Component diagrams) if the user wants them
- Cross-references to higher-level repos

This file is the source of truth for the `adr-historian` agent when
searching for prior decisions.

## ARCHITECTURE.md Template

```markdown
# Architecture — <Project Name>

**Last updated:** <date>
**Owner:** <team / individual>

## Governance Routing

| Decision Level | Lives At | Prefix |
|---|---|---|
| Enterprise / Cross-Cutting | `<path>` | `<prefix>-` |
| Platform / Cross-System | `<path>` | `<prefix>-` |
| System / Solution | `docs/adr/` | (numeric) |
| Service / Component | (within service dir) | (numeric) |
| Code | (in code, no ADR) | — |

## C4 — System Context

<diagram or description>

## C4 — Container

<diagram or description>

## C4 — Component

(deferred unless this repo is a single service)

## Notes

<anything specific to this repo's architectural practice>
```

## When to Re-Run the Interview

- Org structure changes (new platform team, new product, new
  cross-cutting concern).
- A new repo is created.
- A misrouted ADR is discovered (it lived in the wrong place; rerun to
  understand why).
- Mergers / migrations of repos.

## Anti-Patterns

- **Inventing levels that don't exist for your org.** A solo dev doesn't
  need Enterprise + Platform + System — they may have just one level.
- **Skipping the interview "because we know our structure."** The act of
  writing it down catches gaps you didn't see.
- **`ARCHITECTURE.md` as a place to dump decisions.** It's a *routing*
  document. Decisions live in ADRs at the appropriate level.
- **Conflating Service-level decisions with System-level.** When a team
  decides "service X uses Redis," that's Service. When the *product*
  decides "we standardize on Redis for caching across services," that's
  System.
