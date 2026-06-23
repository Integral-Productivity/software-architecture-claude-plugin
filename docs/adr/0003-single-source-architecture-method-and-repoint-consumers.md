# 3. Single-source the architecture method; consumer plugins reference it directly

Date: 2026-06-12

## Status

Accepted

Extends [0002](0002-establish-software-architecture-plugin-and-its-scope.md).

## Context

[ADR-0002](0002-establish-software-architecture-plugin-and-its-scope.md)
extracted several cross-cutting architecture skills from a shared skills
store into this plugin, renamed them (`engineering-architecture-fitness` →
`architectural-fitness-functions`, `engineering-adr` →
`architecture-decision-records`, and so on), and staged the migration in two
steps. Step 2 — decommissioning the original copies — was deferred as
follow-up work.

Two things surfaced after that decision:

1. **A consumer the migration never anticipated.** A *product plugin* (a
   plugin specializing the generic method for one product's domain) declared
   its architecture skills as specializations of the *retired* names — e.g.
   its fitness skill of `engineering-architecture-fitness`, its ADR skill of
   `engineering-adr` / `engineering:architecture` / `engineering:system-design`.
   It also re-stated a third copy of the generic method inline. So the
   generic method had forked across three places (this plugin, the deprecated
   shared-parent layer, and prose embedded in the product plugin), and the
   product plugin pointed at the layer ADR-0002 set out to remove.

2. **The decommission had largely already shipped.** Research for the repoint
   found the original source dirs already gone from the shared store, the
   registry redirect already written with the rename map, and the
   extraction-policy decision already recorded. The residual was mechanical:
   stale build artifacts and orphaned local working copies.

This decision is tracked by
[issue #2](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/2).

## Decision

**This plugin is the single canonical home for the generic architecture
method.** No other location maintains a parallel copy.

**Consumer plugins reference this plugin directly, not a shared
`engineering-*` parent.** A specializing plugin's skills become
*pointer-plus-delta*: they reference `software-architecture:*` skills for the
method and keep only their domain-specific content. Old pointers map by
*kind* — `engineering-adr` → `architecture-decision-records`, but the
generic-architecture pointers `engineering:architecture` /
`engineering:system-design` map to `architectural-characteristics` /
`architectural-trade-offs`, not to the ADR skill.

**The cross-plugin reference is load-bearing and versioned.** When a consumer
invokes its architecture skill at session start to frame all work, and that
skill now defers the method to this plugin, consumer sessions must install
`software-architecture` and load the plugin skill alongside. If the consumer
floats on this plugin's default-branch HEAD (an unpinned marketplace entry),
a rename or section removal here silently degrades every consumer session.
The version contract — whether to pin the consumer's reference to a tag/ref,
and the rename/deprecation obligations this plugin now carries toward its
consumers — is owned here.

**The deprecated-layer decommission is complete in principle; the residual is
cleanup.** Sources, the registry redirect, and the extraction-policy record
already shipped under ADR-0002's plan. What remains is pruning stale build
artifacts and orphaned local copies, plus a consumer-side fitness check that
gates CI on any reappearance of a decommissioned name.

A companion ADR in the consumer plugin's own repo records the dependency from
its side and points back here — follow-up work in that repo, out of scope for
this plugin's ADR.

## Consequences

### Positive

- **One source of truth.** Improvements to the generic method compound to
  every consumer instead of drifting across copies.
- **Consumers carry only their delta.** A consumer's skills shrink to a
  pointer plus genuinely domain-specific content (its constants, toolchain,
  and invariants).
- **ADR-0002's deferred step closes** with the consumer it never accounted
  for now handled explicitly.
- **The invariant is enforced, not just edited.** A CI-gated fitness check
  converts "no stale references" from a one-time edit into a standing
  guarantee.

### Negative

- **A new cross-plugin install dependency.** A consumer session without
  `software-architecture` installed gets a thinner skill than a
  self-contained one, exactly when it needs the framing. Mitigated by the
  session-start install instruction, not enforced by it.
- **Version skew is now a real failure mode.** Floating on this plugin's HEAD
  means a breaking rename here degrades consumers silently, and a stale-name
  check cannot detect a *new* broken pointer. This plugin now owns a
  rename/deprecation contract toward its consumers — a cost the standalone
  copies did not impose.
- **Multi-repo coordination.** A full repoint lands across the consumer
  plugin, the originating skills store, this plugin, and local machine state,
  requiring ordered changes rather than a single merge.

### Revisit triggers

- A second or third consumer plugin repoints to `software-architecture:*`,
  making the version contract's looseness more costly.
- A breaking rename or restructure of a plugin skill that a consumer
  references.
- The distribution mechanism gains (or is decided to need) tag/ref pinning
  for plugin references.
