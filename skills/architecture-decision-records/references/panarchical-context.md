# Higher-level ADRs: panarchical context

## The model

Panarchy (Gunderson and Holling, *Panarchy: Understanding Transformations in
Human and Natural Systems*, 2002) describes nested adaptive cycles. Larger
levels change slowly; smaller levels change fast. Two links connect them:

- **Remember.** When a small, fast level reorganizes, the larger, slower level
  supplies the memory it rebuilds from.
- **Revolt.** A change at a small, fast level can cascade up and trigger
  change at a larger, slower level.

ADRs nest the same way (`software-architecture:architecture-governance-levels`):
enterprise, then platform, then system, then service. An enterprise ADR is
slow to change and wide in effect. A service ADR is fast and narrow.

- **Remember** = a repository decision loads the higher-level ADRs first and
  stays inside the binding ones.
- **Revolt** = a repository decision that departs from, or proves a better way
  than, a binding higher-level ADR is made visible and sent upward through a
  named channel, instead of drifting silently.

## Configuration: the Context Sources table

`/software-architecture:context` writes this section into `ARCHITECTURE.md`.
The `adr-pretooluse.sh` hook and the `software-architecture:adr-historian`
agent read it. The heading and column order are a contract (ADR-0006).

```markdown
## Context Sources

| Order | Level | Source | ADR path | Prefix | Mode | Revolt channel |
|---|---|---|---|---|---|---|
| 1 | Enterprise | <org>/<standards-repo> | docs/adr/ | STD- | binding | <org>/<standards-repo> issues |
| 2 | Platform | <org>/<platform-repo> | docs/adr/ | PLAT- | binding | <org>/<platform-repo> issues |
| 3 | System | this repository | docs/adr/ | numeric | binding | — |
| 4 | Peer | <org>/<sibling-repo> | docs/adr/ | numeric | advisory | — |
```

- **Order.** Load order. Put the slowest, widest level first. Peers come after
  the levels that bind them.
- **Source.** A repository (`owner/name`), a local path, or `this repository`.
- **Mode.** `binding`: a new ADR must stay inside it or record a deviation.
  `advisory`: read for precedent; no deviation needed.
- **Revolt channel.** Where an upstream proposal goes: an issue tracker, a
  proposal process, or a governance meeting. `—` when none.

## Remember: before a new ADR

1. Read the binding sources in order (the `adr-historian` agent does this).
2. List each higher-level ADR that constrains the decision on a
   `Constrained by:` line in the Status section.
3. A source you could not reach is "not searched", never "no constraint".

## Revolt: when the local decision departs

1. Record `Deviates from: <PREFIX-NNN> — <reason>` in the Status section.
2. Offer the user an upstream proposal through that source's revolt channel:
   the deviation, its evidence, and the change it suggests for the higher
   level. Do not file it without the user's approval.
3. When the higher level changes, update the local ADR: drop the deviation,
   or supersede the local ADR if it is no longer needed.

## Without the table

Fall back to the Governance Routing table in `ARCHITECTURE.md`, then to the
repository's own ADR directory, and say that the higher levels are not
configured.
