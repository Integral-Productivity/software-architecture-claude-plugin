---
date: 2026-06-12
topic: architecture-fitness-skill-dedup
---

# Architecture Fitness Skill Deduplication — Requirements

## Summary

Make the `software-architecture` plugin the single source of truth for the generic
architecture method, repoint the praxis architecture skills to it, and decommission the
leftover `engineering-*` copies. This executes the cleanup that
[`docs/adr/0002`](../adr/0002-establish-software-architecture-plugin-and-its-scope.md)
deferred, and resolves a dangling-reference fork that currently points praxis at a
soon-to-be-removed layer.

## Problem Frame

The generic architecture method (fitness functions, ADRs, characteristics, tech radar, BDD,
governance, trade-offs) exists in **three places**, and they have forked:

1. **Canonical** — the `software-architecture` plugin (this repo). Maintained, richest
   version (governance-level routing, ecosystem cross-references, commands/agents/hooks).
2. **Deprecated originals** — `engineering-adr`, `engineering-architecture-fitness`,
   `engineering-tech-radar`, `engineering-bdd`, `event-driven-ddd-modeling`. These were
   extracted from the `Integral-Productivity/skills` monorepo into the plugin and renamed;
   ADR-0002 marked the monorepo cleanup as deferred work. The copies remain — `status: draft`,
   diverging — both in the monorepo and as local `~/.claude/skills/engineering-*` working copies.
3. **Domain specialization** — `praxis-architecture-fitness` and `praxis-platform-adr` in the
   praxis repo. These carry real praxis-specific content (HubSpot/Inngest/LangSmith/Supabase
   constants, `src/fitness/` layout, `pnpm fitness`, encounter invariants) **and** re-state a
   third copy of the generic method.

Two consequences bite. First, praxis declares itself a specialization of the *deprecated*
names — `praxis-architecture-fitness` says it implements `engineering-architecture-fitness`,
`praxis-platform-adr` extends `engineering-adr` — so it references the exact layer ADR-0002
plans to remove. Second, the generic method drifts independently across all three copies, so
improvements to the canonical plugin never reach praxis or the monorepo, and the reverse.

## Key Decisions

**D1 — The plugin is the single source of truth.** The generic architecture method lives in
and is maintained only in the `software-architecture` plugin. No parallel copy is maintained
elsewhere.

**D2 — Praxis repoints to the plugin, not to a shared parent.** Rather than promoting
`engineering-*` into a maintained lightweight parent that both the plugin and praxis reference,
praxis references the plugin skills directly. This buys one canonical layer; it accepts a
cross-plugin install dependency (see R5–R6).

**D3 — Praxis skills become a pointer plus delta.** `praxis-architecture-fitness` strips its
generic prose down to a reference to the plugin skill plus the praxis-specific content only;
`praxis-platform-adr` does the same. This maximizes deduplication. Because praxis invokes
`praxis-architecture-fitness` at every session start to frame all work, the framing the pointer
defers to must be loaded alongside it — which makes the install dependency load-bearing.

```
BEFORE                                          AFTER

software-architecture plugin (canonical) ──┐    software-architecture plugin
engineering-* monorepo copies (draft)  ────┼──▶   = sole source of truth
~/.claude/skills/engineering-* (local) ────┘         ▲           ▲
praxis-architecture-fitness ──▶ engineering-*        │ pointer   │ pointer
praxis-platform-adr        ──▶ engineering-adr   praxis-arch-fitness   praxis-platform-adr
                                                  (+ praxis delta)      (+ praxis delta)
   (method duplicated 3×, refs point             engineering-* DECOMMISSIONED (redirects)
    at the deprecated layer)
```

## Requirements

**Source-of-truth consolidation**

R1. The `software-architecture` plugin is the single canonical home for the generic
architecture method. No other location maintains a parallel copy of that method.

**Praxis repointing**

R2. `praxis-architecture-fitness` references `software-architecture:architectural-fitness-functions`
for all generic method and retains only the praxis delta: the `src/fitness/` spec+checks layout,
`pnpm fitness` toolchain, HubSpot/Inngest/LangSmith/Supabase constants, encounter invariants, and
the praxis-specific check categories (ubiquitous-language, lifecycle, CI).

R3. `praxis-platform-adr` references `software-architecture:architecture-decision-records` for the
generic ADR method and retains only the praxis-platform constraints (dual audience, HubSpot
abstraction, solo-operator velocity, Vercel+Supabase stack).

R4. No praxis skill references any `engineering-*` skill name after the change.

**Session-start wiring (the install dependency)**

R5. The `software-architecture` plugin is installed and reachable in praxis dev sessions, and the
dependency is recorded where praxis documents its plugin setup (alongside the existing
`praxis@integral-productivity-internal` install note).

R6. Praxis's session-start instruction loads both the referenced plugin method skill and
`praxis-architecture-fitness`, so the method the pointer defers to is present when the framing fires.

**Decommission of the deprecated layer**

R7. The five extracted `engineering-*` skills are removed from the `Integral-Productivity/skills`
monorepo, each with a redirect to its plugin successor: `engineering-adr` →
`software-architecture:architecture-decision-records`; `engineering-architecture-fitness` →
`software-architecture:architectural-fitness-functions`; `engineering-tech-radar` →
`software-architecture:technology-radar`; `engineering-bdd` → `software-architecture:bdd-for-architecture`;
`event-driven-ddd-modeling` → `software-architecture:event-storming-for-architecture`.

R8. The local `~/.claude/skills/engineering-*` working copies are removed.

## Scope Boundaries

- **Relocating ownership, not rewriting the method.** The generic method content is not being
  rewritten; it is being made single-sourced. Any content improvement is a separate effort.
- **Non-architecture praxis skills are untouched** — `praxis-concept-audit`,
  `praxis-lineage-orchestrator`, `praxis-concept-portfolio-curator`, and the migration skills are
  out of scope.
- **The plugin's internal skill structure is untouched.** It is already the target; no
  restructuring of its 10 skills / commands / agents / hooks is implied.
- **Execution is the handoff, not this doc.** This artifact captures the decision and
  requirements; the actual edits span multiple repos and are planned separately.

## Dependencies / Assumptions

- **Cross-plugin references resolve only when both plugins are installed.** A
  `software-architecture:*` reference inside a praxis skill is inert in any session where the
  plugin is absent — this is why R5–R6 are first-class, not incidental.
- **Marketplace reachability is satisfied.** The `integral-productivity-internal` marketplace
  (the one praxis installs from, per `praxis@integral-productivity-internal`) already lists both
  `praxis` and `software-architecture`, so the plugin is installable in praxis sessions with no
  publishing prerequisite. R5 is therefore a documentation/setup step, not a blocker. The
  internal-marketplace SSH+SAML setup is intentional and is not to be worked around with HTTPS
  rewrites.
- **This is ADR-0002's deferred migration step 2.** The monorepo decommission was always planned;
  praxis is a second consumer to repoint, which ADR-0002 did not anticipate.
- **The work is multi-repo** — praxis, the `Integral-Productivity/skills` monorepo, and local
  machine state — which makes it a coordination candidate (a GitHub Project) at handoff.

## Outstanding Questions

**Deferred to planning**

- Redirect mechanism for the decommissioned monorepo skills — a `REGISTRY.md` redirect entry
  (as ADR-0002 step 2 anticipated) versus a tombstone `SKILL.md` that names the successor.
- Whether to add a fitness check (in the plugin and/or praxis) that fails when any skill
  references a decommissioned `engineering-*` name — turning R4/R7 into an enforced invariant
  rather than a one-time edit.
- Whether this decision warrants its own ADR (in this repo, superseding/extending ADR-0002's
  migration plan, and/or a praxis `praxis-platform-adr` entry recording the dependency on the
  plugin).

## Sources / Research

- `praxis/plugins/praxis/skills/praxis-architecture-fitness/SKILL.md:22` — declares itself the
  praxis-specific implementation of `engineering-architecture-fitness`.
- `praxis/plugins/praxis/skills/praxis-platform-adr/SKILL.md:17,20` — extends `engineering-adr`.
- `praxis/CLAUDE.md` — invokes `praxis:praxis-architecture-fitness` at every session start to
  frame all work (the framing-role constraint behind R6).
- `praxis/apps/platform/src/fitness/` — the real praxis fitness implementation (spec + 58 checks +
  `cli.ts`); the delta R2 preserves.
- [`docs/adr/0002`](../adr/0002-establish-software-architecture-plugin-and-its-scope.md) lines
  14–17, 51, 69–74, 99 — the extraction, the rename map, "transitional duplication is acceptable,"
  and the deferred monorepo-cleanup step.
- `~/.claude/skills/engineering-architecture-fitness/SKILL.md` — `status: draft`, the diverging
  local copy targeted by R8.
