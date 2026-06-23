---
title: "Cross-plugin pointer-plus-delta — single-source a shared method, reference it from product plugins"
date: 2026-06-12
category: architecture-patterns
module: software-architecture plugin / cross-plugin skill architecture
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - "Two or more Claude plugins would otherwise re-state the same generic method or practice"
  - "A product or domain plugin specializes a generic skill and risks drifting from it"
  - "Decommissioning or renaming a skill that other plugins reference by name"
related_components:
  - documentation
  - development_workflow
tags:
  - claude-plugins
  - skills
  - single-source-of-truth
  - cross-plugin-reference
  - fitness-functions
  - marketplace
---

# Cross-plugin pointer-plus-delta — single-source a shared method, reference it from product plugins

> **Source of record:** [`docs/adr/0003-single-source-architecture-method-and-repoint-consumers.md`](../../adr/0003-single-source-architecture-method-and-repoint-consumers.md) is the decision; this doc is the reusable distilled pattern. ADR-0002 is the parent.

## Context

A generic method (here: architecture-as-code — fitness functions, ADRs, characteristics) had forked across three places: the canonical `software-architecture` plugin, a deprecated `engineering-*` copy, and prose re-stated inside a product plugin that specializes the method. That product plugin's skills declared themselves specializations of the *deprecated* names, so they pointed at a layer that was being retired, and the method drifted independently in each copy.

The forking was a known, deferred cost: the original extraction (2026-05-27, ADR-0002) chose "move the skills into a dedicated plugin, redirect via a registry, rename them" but **deferred the consumer-side repoint and the source-store cleanup** — and never accounted for a second consumer (the product plugin) that needed repointing. This pattern is what closed that gap. (session history)

## Guidance

When the same method lives in more than one plugin, converge on **one owner + pointer-plus-delta consumers**:

1. **One plugin owns the method** (single source of truth). No other location maintains a parallel copy.
2. **Product plugins reference it, not a shared parent.** Each consumer skill keeps only its *delta* (domain constants, file layout, toolchain) and points at the owner's skills by namespace (`software-architecture:architectural-fitness-functions`) for the method. Strip the re-stated generic prose.
3. **Map old pointers by *kind*, not blanket.** An ADR pointer → the ADR skill; a generic-architecture/design pointer → the characteristics/trade-off skills — not all to one successor. Blanket-mapping is a category error.
4. **Wire the consumer's entry point to load both skills, and document the install dependency.** If the consumer invokes its skill at session start to frame all work, the owner's skill must be installed and loaded alongside, or the consumer gets a *thinner* skill exactly when it frames the session.
5. **Enforce the repoint with a CI-gated fitness check.** A static check that fails the build when any consumer skill (body **and** frontmatter), session-start instruction file, or eval references a decommissioned name. Without it, the repoint silently regresses.
6. **Decommission the old copies** with a registry redirect + a policy ADR. (Often already partly done — verify before re-doing; see Prevention.)

## Why This Matters

Dedup is the obvious win — improvements to the method compound to every consumer instead of drifting across copies. But the pattern introduces **three failure modes that are the real content of the decision**:

- **Load-bearing install dependency.** Repointing trades a working-but-duplicated skill for a thinner one that is *strictly worse* when the owner plugin is absent — and absence bites at the consumer's most load-bearing moment (session-start framing). The session-start install instruction mitigates but cannot enforce this. (session history)
- **Version skew.** If the owner is listed **unpinned** in the marketplace, the consumer floats on the owner's default-branch HEAD. A rename or section removal in the owner silently degrades every consumer session, and a stale-*old*-name check cannot detect a *new* broken pointer into the owner. Mitigate by pinning the marketplace entry to a tag/ref, or by recording a rename/deprecation contract the owner owes its consumers.
- **Silent regression.** The repoint is a one-time edit unless enforced; the CI-gated check (step 5) is what makes "no stale references" a standing invariant rather than a fact that decays.

## When to Apply

- A generic skill/method is about to be copied into a second plugin → reference instead.
- A product plugin's skill re-states a method that a shared plugin already owns.
- You're decommissioning or renaming skills that other plugins name.

Do **not** strip a consumer skill to a pure pointer if the owner plugin cannot be guaranteed present at the consumer's entry point and you can't tolerate the thinner-skill degradation — keep a short inline method recap instead.

## Examples

Concrete instances from the worked case:

- **Pointer-plus-delta repoint:** a product plugin's architecture skills strip the generic method and reference `software-architecture:*`, keeping only their domain constants and toolchain. Precedent for the pointer shape: `tdd-as-architectural-discipline` → `superpowers:test-driven-development` (a pointer-only skill from day one). (session history)
- **By-kind mapping:** `engineering-adr` → `architecture-decision-records`; `engineering:architecture` / `engineering:system-design` (generic design) → `architectural-characteristics` / `architectural-trade-offs`, **not** `architecture-decision-records`.
- **Enforcement check:** a static `no-decommissioned-skill-references` fitness check scanning every `SKILL.md` (frontmatter included), the session-start `CLAUDE.md`, and `evals.json`, returning a hard `fail` on any old name — wired into the CI fitness gate, not just a local run.

## Prevention

- **Verify decommission state before acting — most of it often already shipped.** In the worked case, the old skills' sources, the `REGISTRY.md` redirect, and the policy ADR were already done; the residual was only gitignored build artifacts + orphaned local copies. Re-check live state rather than trusting the plan's assumptions.
- **A "remove the copies" list is a verification target, not a fact.** Confirm whether build artifacts are git-tracked or gitignored (no PR needed for gitignored), and re-list local copies — counts drift (the worked case found a 5th orphaned dir the plan had ruled out).
- **Scan all surfaces for stale names**, not just the obvious `SKILL.md` body: frontmatter `description:`, session-start instruction files, and eval fixtures all carried stale references in the worked case.

## Related

- [ADR-0003](../../adr/0003-single-source-architecture-method-and-repoint-consumers.md) — source of record (this plugin); [ADR-0002](../../adr/0002-establish-software-architecture-plugin-and-its-scope.md) — parent (the original extraction).
- Issue [#2](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/2) (tracking), PR [#3](https://github.com/Integral-Productivity/software-architecture-claude-plugin/pull/3) (this repo's docs + ADR).
- **Open at capture (2026-06-12):** the distribution entry for the owner plugin was still unpinned (floating on HEAD); the version-pinning contract was an unresolved obligation. A future reader should check whether pinning landed.
