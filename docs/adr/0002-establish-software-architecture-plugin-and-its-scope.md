# 2. Establish software-architecture plugin and its scope

Date: 2026-05-27

## Status

Accepted

## Context

Architectural practice in an engineering organization is typically spread
across several homes:

- A general skills/knowledge store holding cross-cutting architecture
  skills (ADR practice, fitness functions, tech radar, BDD, event-driven
  DDD modeling).
- A standards repo holding the canonical Technology Radar and cross-cutting
  ADRs.
- A platform/DevOps repo holding CI/DevOps decisions.
- Product repos holding product-scoped ADRs.

Skills activate passively when a description matches a user's prompt, but
**architecture is not embedded in the SDLC**:

- No hooks surface prior ADRs at the moment a new decision is being made.
- No agents automatically search ADRs before planning.
- No command surface walks a developer through a Hard Parts-grade
  trade-off analysis.
- Multi-level governance (Enterprise / Platform / System / Service /
  Code) is implicit, defined only in scattered global configuration.

There is an established precedent for dedicated Claude Code plugins
distributing **product-specific** skills. This plugin extends that
precedent to **practice-specific** content: cross-product knowledge that
forms a coherent bundle and benefits from being shipped as one.

The triggering case is a desire to operationalize Neal Ford's two books
— *Fundamentals of Software Architecture* (both editions) and *Software
Architecture: The Hard Parts* — as an active practice across an
organization, not just as references.

## Decision

We create a dedicated Claude Code plugin, **`software-architecture`**,
published from its own repository and installed as a Claude Code plugin
marketplace.

The plugin contains:

- **10 skills**: 5 extracted from the monorepo (renamed for the plugin's
  taxonomy and namespace), 4 net-new Neal Ford–grounded skills, and 1
  thin-pointer skill that cross-references `superpowers:test-driven-development`.
- **7 commands** under the `/software-architecture:` prefix.
- **3 subagents**: `adr-historian` (Sonnet), `fitness-author` (Sonnet,
  worktree-isolated), `architecture-reviewer` (Opus).
- **5 hooks** with opt-out via `SA_PLUGIN_HOOKS`.
- **Multi-level governance model**: 5 levels (Enterprise / Platform /
  System / Service / Code) mapped to Simon Brown's C4 model.

The plugin's scope is **architecture-as-a-practice** — meta-practices
that govern engineering work across the lifecycle. It does **not**
duplicate the inner engineering loops (TDD, code-review mechanics), Lean
operational discipline, or CI/CD machinery, all of which live in other
plugins or repos.

Migration is staged in two steps:

1. **Plugin creation:** content extracted into the plugin; any pre-existing
   copies in a general skills store still exist (transitional duplication is
   acceptable for one cycle).
2. **Source cleanup (follow-up):** delete the extracted skills from their
   original home; add redirects; record the policy that practice-specific
   skills extract to dedicated plugins.

## Consequences

### Positive

- **Architecture decisions surface in the moment.** Hooks 2 and 5 catch
  decision-language and pre-plan reviews; Hook 3 catches dependency-ring
  conflicts at edit time.
- **Coherent teachable bundle.** Skills, commands, agents, and hooks all
  reinforce the same Neal Ford–grounded practice. Users install one
  thing; the whole practice activates.
- **Multi-level governance is now first-class.** The
  `architecture-governance-levels` skill + `/software-architecture:context`
  command make routing explicit, replacing the implicit global-config
  convention.
- **The plugin eats its own dogfood.** Decisions about the plugin's
  structure land as ADRs in `docs/adr/` of this repo.
- **Hard Parts archetypes are loadable on demand.** The
  `decision-archetypes/` files in `architectural-trade-offs/` provide
  just-in-time depth without bloating skill activation.

### Negative

- **Migration cost.** The source-cleanup step is real work; old skill
  addresses won't work until users update.
- **Hook noise risk.** Five hooks fire frequently. If activation regexes
  are tuned poorly, users will disable hooks (opt-out is supported but
  defeats the purpose). Hook 2 in particular needs tuning against real
  transcripts.
- **Plugin sprawl risk.** Now that the precedent exists for
  practice-specific plugins, future contributors may propose carving out
  more bundles (Lean, BDD-only, etc.). Each such proposal needs its own
  scoping ADR.
- **Coupling to external standards repos.** Several skills and hooks can
  read an org's standards repo / custom radar when configured. If none is
  configured, behaviors degrade gracefully. The radar-as-database follow-up
  will harden this.

### Follow-ups (filed separately)

- **Radar-as-database ADR** at the enterprise / cross-cutting level —
  replace the markdown radar with a structured store so hooks can query
  without parsing markdown.
- **Source-policy ADR** in the originating skills store — practice-specific
  skills extract to dedicated plugins.
- **Federation across orgs** — long-term, for publishing the practice
  beyond a single organization.

## Revisit Triggers

Revisit this ADR when:
- A second practice-specific plugin is proposed (decide if both extract
  pattern is right, or if there's a better aggregation).
- The plugin's surface area grows beyond ~15 skills (consider
  decomposition).
- Hook activation noise drives users to disable > 2 hooks by default.
- Multi-level governance evolves (e.g., new Team or Domain level added).
