# 7. Draft technology-adoption ADRs from the configured radars

Date: 2026-11-13

## Status

Proposed

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

1. **Radar Sources table.** `ARCHITECTURE.md` may hold a `## Radar Sources`
   table (Order, Radar, Location, Kind `file|url|mcp|thoughtworks`, Mode
   `binding|advisory`). `/software-architecture:context` writes it.
   `SA_RADAR_PATH` stays as the fallback and as Hook 3's input.
2. **Ring-shaped ADRs.** The ADR skill's `references/technology-adoption.md`
   requires a Radar evidence section and a radar row in the options table,
   and adds ring-specific sections: Trial needs scope and exit criteria; Hold
   needs `Deviates from:` and an upstream proposal; not on the radar is
   treated as Assess.
3. **`/software-architecture:adopt`** drafts the ADR end to end and offers
   `/software-architecture:radar` to move the ring to match.
4. **Hooks point to it.** Hook 10 lists the Radar Sources in order when an
   ADR is written; Hook 3 suggests `/software-architecture:adopt` for a new
   Hold, Trial or unknown dependency.

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
