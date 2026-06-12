# 3. Single-source the architecture method; product plugins reference it directly

Date: 2026-06-12

## Status

Accepted

Extends [0002](0002-establish-software-architecture-plugin-and-its-scope.md).

## Context

[ADR-0002](0002-establish-software-architecture-plugin-and-its-scope.md)
extracted five cross-cutting architecture skills from the
`Integral-Productivity/skills` monorepo into this plugin, renamed them
(`engineering-architecture-fitness` → `architectural-fitness-functions`,
`engineering-adr` → `architecture-decision-records`, and so on), and
staged the migration in two PRs. Step 2 — decommissioning the monorepo
copies — was deferred as follow-up work.

Two things surfaced after that decision:

1. **A second consumer the migration never anticipated.** The `praxis`
   plugin's architecture skills declare themselves specializations of the
   *retired* names: `praxis-architecture-fitness` of
   `engineering-architecture-fitness`, and `praxis-platform-adr` of
   `engineering-adr` / `engineering:architecture` /
   `engineering:system-design`. Praxis also re-states a third copy of the
   generic method inline. So the generic method forked across three places
   (this plugin, the deprecated `engineering-*` layer, and prose embedded
   in praxis), and praxis points at the layer ADR-0002 set out to remove.

2. **The decommission had largely already shipped.** Research for the
   repoint found the `engineering-*` source dirs already gone from the
   monorepo, the `REGISTRY.md` redirect already written with the rename
   map, and the policy ADR (`skills` ADR-0004) already filed. The residual
   is mechanical: stale `build/engineering-*.{skill,hash}` artifacts and
   orphaned `~/.claude/skills/engineering-*` local copies.

The decision recorded here was reached through a brainstorm and plan
(`docs/brainstorms/2026-06-12-architecture-fitness-skill-dedup-requirements.md`,
`docs/plans/2026-06-12-001-refactor-architecture-fitness-skill-dedup-plan.md`)
and is tracked by
[issue #2](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/2).

## Decision

**This plugin is the single canonical home for the generic architecture
method.** No other location maintains a parallel copy.

**Product plugins reference the plugin directly, not a shared `engineering-*`
parent.** Praxis is the first consumer to repoint: its skills become
pointer-plus-delta, referencing `software-architecture:*` skills for the
method and keeping only their domain-specific content. Old pointers map by
*kind* — `engineering-adr` → `architecture-decision-records`, but the
generic-architecture pointers `engineering:architecture` /
`engineering:system-design` map to `architectural-characteristics` /
`architectural-trade-offs`, not to the ADR skill.

**The cross-plugin reference is load-bearing and versioned.** Because praxis
invokes its architecture skill at every session start to frame all work, and
that skill now defers the method to this plugin, praxis sessions must install
`software-architecture` and load the plugin skill alongside. The reference is
to a versioned plugin: the `integral-productivity-internal` marketplace
currently lists `software-architecture` unpinned (it resolves to this repo's
default-branch HEAD) while `praxis` pins `ref: main`, so a rename or section
removal here silently degrades every praxis session. The version contract —
whether to pin the marketplace entry to a tag/ref, and the
rename/deprecation obligations this plugin now carries toward its consumers —
is owned here.

**The `engineering-*` decommission is complete in principle; the residual is
cleanup.** Sources, the `REGISTRY.md` redirect, and the policy ADR
(`skills` ADR-0004) already shipped under ADR-0002's plan. What remains is
pruning stale build artifacts and orphaned local copies, plus a praxis
fitness check that gates CI on any reappearance of a decommissioned name.

A companion ADR in the praxis repo (`praxis/docs/adr/`) records the
dependency from praxis's side and points back here — that is follow-up work
in the praxis repo, out of scope for this plugin's ADR.

## Consequences

### Positive

- **One source of truth.** Improvements to the generic method compound to
  every consumer instead of drifting across three copies.
- **Praxis carries only its delta.** The praxis skills shrink to a pointer
  plus genuinely praxis-specific content (HubSpot/Inngest/LangSmith/Supabase
  constants, encounter invariants, the `pnpm fitness` toolchain).
- **ADR-0002's deferred step closes** with the second consumer it never
  accounted for now handled explicitly.
- **The invariant is enforced, not just edited.** A CI-gated praxis fitness
  check converts "no stale references" from a one-time edit into a standing
  guarantee.

### Negative

- **A new cross-plugin install dependency.** A praxis session without
  `software-architecture` installed gets a thinner skill than today's
  self-contained one, exactly when it needs the framing. Mitigated by the
  session-start install instruction, not enforced by it.
- **Version skew is now a real failure mode.** Floating on the plugin's HEAD
  means a breaking rename here degrades praxis silently, and a stale-name
  check cannot detect a *new* broken pointer. This plugin now owns a
  rename/deprecation contract toward its consumers — a cost the standalone
  `engineering-*` copies did not impose.
- **Multi-repo coordination.** The full change lands across praxis, the
  skills monorepo, this plugin, and local machine state, requiring ordered
  PRs rather than a single merge.

### Revisit triggers

- A second or third product plugin repoints to `software-architecture:*`,
  making the version contract's looseness more costly.
- A breaking rename or restructure of a plugin skill that a consumer
  references.
- The marketplace gains (or is decided to need) tag/ref pinning for internal
  plugins.
