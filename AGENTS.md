# AGENTS.md — Software Architecture plugin

Orientation for agents working in this repo. For the full feature list see
[README.md](README.md); for how to add or change skills/commands/agents/hooks
see [CONTRIBUTING.md](CONTRIBUTING.md). This file covers what those don't:
where things live, the knowledge stores, and the working conventions.

## What this repo is

The `software-architecture` Claude Code plugin — cross-product architecture
practice (ADRs, fitness functions, technology radar, multi-level governance,
Hard Parts trade-off analysis) delivered as skills, commands, agents, and hooks.
Grounded in Neal Ford's *Fundamentals of Software Architecture* and *The Hard
Parts*. Scope is **cross-product**; product-specific content lives in that
product's own plugin (per SAE-006 — see CONTRIBUTING.md).

## Repo map

```
skills/        # 10 architecture-practice skills (the product)
commands/      # /software-architecture:<verb> commands
agents/        # adr-historian, fitness-author, architecture-reviewer
hooks/         # 5 hooks (opt-out via SA_PLUGIN_HOOKS)
docs/adr/      # ADRs about THIS plugin's own structure (dogfooding)
docs/brainstorms/, docs/plans/   # ce-brainstorm / ce-plan artifacts
docs/solutions/                  # documented solutions to past problems (see below)
CONCEPTS.md                      # shared domain vocabulary (see below)
```

## Knowledge stores

These accumulate institutional knowledge — consult them when orienting or
before working in an area they cover.

- **`docs/solutions/`** — documented solutions to past problems (bugs, best
  practices, architecture patterns, workflow learnings), organized by category
  with YAML frontmatter (`module`, `tags`, `problem_type`, `component`).
  Relevant when implementing or debugging in a documented area. Written by
  `ce-compound`; maintained by `ce-compound-refresh`.
- **`CONCEPTS.md`** — shared domain vocabulary (architectural characteristic,
  fitness function, decision archetype, governance level, ADR, technology radar,
  and the cross-plugin-skill terms). Relevant when orienting to the codebase or
  discussing domain concepts.
- **`docs/adr/`** — decisions about the plugin itself. Read the relevant ADR
  before changing structure it governs; capture new structural decisions as ADRs
  (`adr new <title>`).

## Working conventions

Full detail in [CONTRIBUTING.md](CONTRIBUTING.md). The essentials:

- **Branches:** `claude/<slug>` for Claude-authored work (enables auto-merge on
  green CI), `adr/<slug>` for plugin-local ADR work, `feat|fix|chore/<slug>` for
  human work.
- **Commits:** Conventional Commits (`feat(scope):`, `fix:`, `chore:`, `docs:`,
  `ci:`). Never bypass CI (`--no-verify` is out of bounds).
- **Decisions:** structural/architectural decisions about the plugin land as ADRs
  in `docs/adr/`. The plugin eats its own dogfood.
- **Cross-references** between skills use the full namespace
  (`software-architecture:<skill-name>`), never the bare name.
- **Testing:** see `package.json`. Tests cover frontmatter validity (skills,
  commands, agents) and that hook scripts are executable and emit valid JSON.

## Distribution

Distributed via `Integral-Productivity/marketplace-internal`; merging to `main`
auto-publishes. Installs over the internal marketplace use SSH + SAML-SSO by
design — that is the intended auth posture, not a bug to route around.
