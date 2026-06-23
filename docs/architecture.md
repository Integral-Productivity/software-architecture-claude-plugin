# Architecture — Software Architecture Plugin

**Last updated:** 2026-05-27
**Owner:** Integral Productivity

This is the plugin's own `ARCHITECTURE.md` — produced by eating our own
dogfood from `/software-architecture:context`.

## Governance Routing

This plugin's own ADRs live at the System / Solution level (`./docs/adr/`).
The other levels are filled in per-consuming-org via
`/software-architecture:context`; the rows below show the *shape*, not
specific repos.

| Decision Level | Lives At | Prefix |
|---|---|---|
| Enterprise / Cross-Cutting | your org's standards repo `docs/adr/` | org-defined |
| Platform / Cross-System | your org's platform/DevOps repo `docs/adr/` | org-defined |
| System / Solution (this plugin) | [`./docs/adr/`](docs/adr/) | numeric |
| Service / Component | n/a — single-package repo | n/a |
| Code | reflected in code structure | n/a |

## C4 — System Context

The plugin lives inside the user's Claude Code installation, alongside
other plugins (superpowers, lean-management, holacracy, etc.). It
interacts with:

- **The user** — invokes commands, receives system reminders from hooks
- **The user's repos** — reads `.adr-dir`, `docs/adr/`, dependency files
- **The consuming org's standards repos** (configured in `ARCHITECTURE.md`) —
  reads the custom radar and cross-cutting ADRs, when present
- **Other plugins** — delegates TDD inner-loop to
  `superpowers:test-driven-development`; coexists with `superpowers:*`
  meta-skills

## C4 — Container

The plugin is **one container** (a single Claude Code plugin). Its
internal building blocks:

| Container | Role |
|---|---|
| `.claude-plugin/plugin.json` | Manifest |
| `.claude-plugin/hooks.json` | Hook event registration |
| `skills/` | 10 skill files (passive knowledge) |
| `commands/` | 7 command entry points |
| `agents/` | 3 subagent definitions |
| `hooks/` | 5 bash scripts emitting Claude Code hook JSON |
| `docs/adr/` | Plugin-local ADRs |

## C4 — Component

(Deferred — the plugin is a single deployable unit; C3 components are
the individual skills/agents/hooks, already enumerated above.)

## Architectural Characteristics

The plugin's top characteristics (chosen via the
`architectural-characteristics` skill applied to itself):

| Characteristic | Priority | Measurement |
|---|---|---|
| Modifiability | Firm | New skill < 1 day; new command < 4 hours |
| Observability | Firm | Hook firings logged; agent dispatches traceable |
| Cost (cognitive) | Firm | Each skill description ≤ 4 sentences; clear trigger phrases |
| Compatibility (with Claude Code) | Soft | Hooks emit valid Claude Code JSON; tested against current CLI |
| Discoverability | Soft | Slash-command listing surfaces all 7 commands |

## Cross-References

| From | To | Why |
|---|---|---|
| `architectural-fitness-functions` skill | a generic `fitness/adr-format.ts`-style check | Worked example pattern |
| `technology-radar` skill | the org's custom radar (location in `ARCHITECTURE.md`) | Canonical radar location |
| `architecture-decision-records` skill | Cross-repo ADR routing via `ARCHITECTURE.md` | Governance topology |
| `adr-historian` agent | the ADR homes named in `ARCHITECTURE.md` | Routing destinations |
| Hook 3 (deps) | the org's custom radar file (if configured) | Runtime read |

## Notes

This plugin uses the `software-architecture:` namespace. Skills and
commands are addressed as `software-architecture:<name>`. Internal
cross-references use this form.

The plugin is **opt-out** on all hooks by default. Users can disable
individual hooks via the `SA_PLUGIN_HOOKS` env var — see README.md.
