# Architecture — Software Architecture Plugin

**Last updated:** 2026-05-27
**Owner:** Kraig Parkinson / Integral Productivity

This is the plugin's own `ARCHITECTURE.md` — produced by eating our own
dogfood from `/software-architecture:context`.

## Governance Routing

| Decision Level | Lives At | Prefix |
|---|---|---|
| Enterprise / Cross-Cutting | [`software-architecture-excellence/docs/adr/`](https://github.com/Integral-Productivity/software-architecture-excellence) | `SAE-` |
| Platform / Cross-System | [`devops-excellence/docs/adr/`](https://github.com/Integral-Productivity/devops-excellence) | `ADR-` |
| System / Solution (this plugin) | [`./docs/adr/`](docs/adr/) | numeric |
| Service / Component | n/a — single-package repo | n/a |
| Code | reflected in code structure | n/a |

## C4 — System Context

The plugin lives inside the user's Claude Code installation, alongside
other plugins (superpowers, lean-management, holacracy, etc.). It
interacts with:

- **The user** — invokes commands, receives system reminders from hooks
- **The user's repos** — reads `.adr-dir`, `docs/adr/`, dependency files
- **Sibling IP repos** (`software-architecture-excellence`,
  `devops-excellence`) — reads canonical radar and cross-cutting ADRs
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
| `architectural-fitness-functions` skill | `software-architecture-excellence/fitness/adr-format.ts` | Worked example referenced |
| `technology-radar` skill | `software-architecture-excellence/docs/tech-context/radar.md` | Canonical radar location |
| `architecture-decision-records` skill | Cross-repo ADR routing via CLAUDE.md | Governance topology |
| `adr-historian` agent | `~/GitHub/software-architecture-excellence/docs/adr/`, `~/GitHub/devops-excellence/docs/adr/` | Routing destinations |
| Hook 3 (deps) | `software-architecture-excellence/docs/tech-context/radar.md` | Runtime read |
| SAE-006 (Integral-Productivity) | This plugin's existence | Precedent for dedicated-repo distribution |

## Notes

This plugin uses the `software-architecture:` namespace. Skills and
commands are addressed as `software-architecture:<name>`. Internal
cross-references use this form.

The plugin is **opt-out** on all hooks by default. Users can disable
individual hooks via the `SA_PLUGIN_HOOKS` env var — see README.md.
