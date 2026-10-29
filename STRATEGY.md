---
name: software-architecture
last_updated: 2026-10-29
---

# software-architecture Strategy

## Purpose

Architecture is not embedded in how agents and developers change software. Prior decisions, the quality attributes a system must keep, and the boundaries a repository sets exist in documents, but nothing puts them in front of the agent at the moment a change is made. It is hard because the moment of decision is short and implicit, and because "the document exists" does not mean "it was consulted". (Source: ADR-0002.)

## Positioning

**When an agent or a developer is about to make an architectural decision or change, the right context shows up** (README). The plugin embeds the practice in the session through hooks, agents and commands, instead of running a parallel review process. Everything is a trade-off, architecture is a hypothesis tested by fitness functions, and each decision lives at the right governance level (README, Philosophy).

## Users

**Primary:** an engineer or AI agent session that changes software in a repository. They hire the plugin so that prior decisions, quality attributes and boundaries are in context before the change, and the change is checked against them.

**Secondary:** an architecture owner who sets org-level standards (radar, cross-cutting ADRs) and wants them applied in every repository without manual review.

## Boundaries

- Practice, not product. A skill that encodes one product's internals, data model or stack belongs in that product's plugin (CONTRIBUTING.md).
- It does not duplicate inner engineering loops (TDD, code-review mechanics), Lean operational discipline or CI/CD machinery (ADR-0002). It wraps or points to them.
- Bring your own standards, then enforce them. The code hard-codes no organization, repository or system name; consumers configure where their standards live (`ARCHITECTURE.md`, `SA_RADAR_PATH`). Once configured, the plugin deliberately consumes them: it surfaces the configured ADRs and radar, checks changes against them (for example the Hold ring in the dependency hook), and treats them as the source of truth for its guidance. Each adopting organization's own standards (its radar, its ADRs) enter through this configuration, not through the plugin's code.
- Hooks are opt-out, warn before they block, and stay silent when they have nothing to say.
- It reads governing documents; it does not write their content for the user. It names the skill that writes a missing one (for example ce-strategy for STRATEGY.md, the qualitymd `quality` skill for QUALITY.md).
- No state across sessions in hooks.

_Resist a change when:_ it encodes one product's internals, hard-codes an organization, rebuilds a CI or review mechanic another plugin owns, or blocks without evidence from a warn period.

## Key metrics

- **Context before change** - share of first changes in a repository where the governing documents (STRATEGY.md, QUALITY.md, ARCHITECTURE.md, relevant ADRs) were read in the same session first; hook log.
- **Decisions recorded** - share of architectural decisions in a session that end as an ADR at the right governance level; Stop-hook sweep and ADR counts.
- **Characteristics under test** - share of declared quality attributes (QUALITY.md factors or architectural characteristics) that have a fitness function or are a declared gap; repository scan.
- **Hold-ring hits** - dependency changes stopped or flagged by the radar hook; hook log.

## Tracks

### Decision practice

ADRs, governance levels, trade-off analysis and the radar: the existing skills, commands and agents.

_Why it serves the approach:_ it is the content the "right context" draws from.

### Governing-document anchors

The repo-anchors capability: a warn-mode gate that checks STRATEGY.md and QUALITY.md were read before the first change in a repository, and ARCHITECTURE.md too when the repository has one; a reminder before the compound-engineering steps that do not read them (ce-work, ce-debug, ce-code-review, lfg); and a Compound Pack with three rules (strategy boundaries, quality requirements, key metrics) for the steps that do. QUALITY.md factors are treated as architectural characteristics.

_Why it serves the approach:_ the existing hooks surface ADRs and the radar; STRATEGY.md, QUALITY.md and ARCHITECTURE.md are the same kind of governing context, and "consulted" is the test the other hooks do not make.

### Fitness and evolution

Fitness functions as executable checks of characteristics, including checks of the anchors themselves (present, in format, not stale).

_Why it serves the approach:_ architecture is a hypothesis; fitness functions are the experiments.

## Brand

**One-liner:** The right architectural context, at the moment of change.

**Key message:** Architecture embedded in the work, not beside it.

## Relationship to other plugins

- product-architecture (organization-specific) owns product-to-architecture lineage. Its "Session enforcement" track and its anchor metrics point to this plugin's anchors track for the generic gate.
- compound-engineering: this plugin closes CE's anchor gaps with CE's own Compound Packs where possible, and a reminder hook where not. Upstream issue EveryInc/compound-engineering-plugin#1947 asks CE to close them natively; each part of the reminder is removed when CE ships the matching part.
