---
title: Technology-adoption ADRs from configured radars - Plan
type: feat
date: 2026-11-13
execution: code
---

# Technology-adoption ADRs from configured radars - Plan

Decision: [ADR-0007](../adr/0007-draft-technology-adoption-adrs-from-configured-radars.md).
Shipped in PR #78.

## Feature detail (moved from ADR-0007)

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

