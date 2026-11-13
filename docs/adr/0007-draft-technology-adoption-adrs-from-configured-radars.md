# 7. Draft technology-adoption ADRs from the configured radars

Date: 2026-11-13

## Status

Proposed (revised 2026-11-13 before acceptance: feature detail moved to the plan)

Constrained by: [ADR-0006](0006-scope-adrs-to-architecture-and-load-higher-levels-in-panarchical-order.md)
(scope test, ADR-file hook, Context Sources).

## Context

A technology selection is one of the five architectural scopes in ADR-0006.
The plugin already reads a Markdown radar through `SA_RADAR_PATH` (Hook 3)
and tells the agent to "invoke the radar skill" when an ADR selects a
technology. Three gaps remain:

1. Only one radar location is configurable, and only as a file. Consuming
   organizations can also run a radar as a service behind an MCP server, and
   the Thoughtworks radar is a second, advisory source.
2. The radar check is advice in prose. The ADR shape does not change with the
   ring: a Hold adoption and an Adopt adoption are drafted the same way.
3. An adoption ADR does not feed back to the radar, so the radar does not
   learn from local experience (the revolt link of ADR-0006).

## Decision

**Radars are configured as an ordered list of sources of different kinds in
`ARCHITECTURE.md`, and a technology-adoption ADR is drafted from those
sources by the agent, not checked by a hook.** Hooks stay local and only
name the sources, because a radar can be a remote service that a hook may
not call (QUALITY.md, hooks-stay-local). The organization's own ring is
binding input to the decision, so an adoption against a Hold ring is
recorded as a deviation and offered upward, which closes the revolt loop
between ADRs and the radar. Feature detail (table columns, the drafting
command, the ring-specific ADR sections, hook messages) is specified in
[docs/plans/2026-11-13-technology-adoption-from-radars-plan.md](../plans/2026-11-13-technology-adoption-from-radars-plan.md).

## Options considered

| Dimension | A. Prose advice only (status quo) | B. Radar Sources + ring-shaped ADR + adopt command (chosen) | C. Hook blocks adoption ADRs without radar evidence |
|---|---|---|---|
| Multiple radars, incl. services | No | Yes | Yes |
| ADR shape follows ring | No | Yes | Yes |
| Fits warn-before-block | Yes | Yes | No |
| Feeds the radar back | No | Offered, user approves | Offered |
| Cost | None | One command, one reference, hook text | Higher; a judgment is hard to test |

## Consequences

- Easier: an adoption ADR cites the actual radar entries; Hold adoptions are
  visible as deviations; the radar gains a path to learn from ADRs.
- Harder: a second table in `ARCHITECTURE.md` whose columns are a contract.
- Cost: an `mcp` radar is looked up by the agent, not the hook; hooks stay
  local (QUALITY.md, hooks-stay-local).

## Revisit triggers

- Hook 3 starts reading Radar Sources directly (would need a local file per
  radar) — supersede the "SA_RADAR_PATH fallback" part.
- A consumer audit finds adoption ADRs without a Radar evidence section after
  this ADR in more than 1 in 4 cases.
