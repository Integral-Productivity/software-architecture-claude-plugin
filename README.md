# Software Architecture Claude Plugin

> Adaptive and evolutionary software architecture practice for the full
> SDLC. Grounded in Neal Ford's *Fundamentals of Software Architecture*
> and *Software Architecture: The Hard Parts*.

This plugin embeds architecture in the development process rather than
running parallel to it. Skills, commands, agents, and hooks all converge
on a single goal: **when a developer is about to make an architectural
decision, the right context shows up.**

## What's in the plugin

### 10 Skills

| Skill | Origin | Coverage |
|---|---|---|
| `architecture-decision-records` | extracted | ADR practice, routing across repos |
| `architectural-fitness-functions` | extracted | Fitness as code, drift prevention |
| `technology-radar` | extracted | Adopt/Trial/Assess/Hold |
| `bdd-for-architecture` | extracted wrapper | BDD as architectural verification |
| `event-storming-for-architecture` | extracted wrapper | Domain → boundaries → services |
| `architectural-characteristics` | new | Eliciting & prioritizing -ilities |
| `architectural-trade-offs` | new | Hard Parts decision archetypes |
| `evolutionary-architecture` | new | Continuous architectural verification |
| `architecture-governance-levels` | new | 5-level governance + C4 model |
| `tdd-as-architectural-discipline` | thin pointer | Inner-loop framing |

### 7 Commands

All commands use the `/software-architecture:` prefix.

- `/software-architecture:decide` — guided ADR creation
- `/software-architecture:trade-off` — Hard Parts trade-off analysis (no ADR)
- `/software-architecture:fitness` — author or run fitness functions
- `/software-architecture:radar` — propose a radar ring change
- `/software-architecture:review` — architectural review of current diff
- `/software-architecture:characterize` — workshop architectural characteristics
- `/software-architecture:context` — multi-level governance interview

### 3 Agents

- `adr-historian` (Sonnet) — searches prior ADRs across configured repos
- `fitness-author` (Sonnet, worktree-isolated) — scaffolds new fitness functions
- `architecture-reviewer` (Opus) — structured architectural review

### 5 Hooks (opt-out via `SA_PLUGIN_HOOKS`)

| Hook | Event | Purpose |
|---|---|---|
| 1 | `SessionStart` | ADR + radar orientation |
| 2 | `UserPromptSubmit` | Architectural decision-language detector |
| 3 | `PreToolUse` (dep files) | Radar ring enforcement |
| 4 | `Stop` | End-of-session decision sweep reminder |
| 5 | `PreToolUse` (ExitPlanMode) | Architectural review before plan submission |

## Installation

Via the IP internal marketplace:

```
/plugin install software-architecture@integral-productivity-internal
```

## Setup

After installation, run the setup interview to establish the governance
routing for your repo:

```
/software-architecture:context
```

This produces `ARCHITECTURE.md` at the repo root, which the
`adr-historian` agent reads to find prior decisions.

## Disabling individual hooks

Set the environment variable `SA_PLUGIN_HOOKS` to a comma-separated list
of enabled hook short-names:

| Short name | Hook |
|---|---|
| `session` | SessionStart orientation |
| `prompt` | Decision-language detector |
| `deps` | Dependency / radar enforcement |
| `stop` | End-of-session reminder |
| `planreview` | Pre-plan architectural review |

Example: `export SA_PLUGIN_HOOKS=session,prompt,deps` (disables stop and
planreview).

When the variable is unset, all hooks are enabled.

## Philosophy

The plugin is opinionated about three things:

1. **Everything is a trade-off** (Ford, *Hard Parts*). Decisions are
   conditional on the characteristics prioritized. ADRs capture the
   conditions.
2. **Architecture is a hypothesis** (Ford et al., *Building Evolutionary
   Architectures*). Fitness functions are the experiments that test
   whether the hypothesis still holds.
3. **Decisions live at the right level** (this plugin's framework).
   Enterprise / Platform / System / Service / Code each have their own
   ADR home; mis-routed decisions cause drift.

## Related plugins (delegated to)

- `superpowers:test-driven-development` — inner-loop TDD (we wrap, not duplicate)
- `superpowers:receiving-code-review`, `requesting-code-review` — review *mechanics*
- `lean-management` — day-to-day operational discipline
- `holacracy` — governance circles

## Related repos

- `software-architecture-excellence` — canonical IP Technology Radar +
  cross-cutting ADRs (this plugin reads from)
- `devops-excellence` — CI/DevOps ADRs (this plugin's routing references)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Internal use only (Integral Productivity).
