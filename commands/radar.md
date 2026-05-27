---
name: radar
description: Propose a Technology Radar ring change. Edits the canonical radar at software-architecture-excellence/docs/tech-context/radar.md and scaffolds a companion ADR.
---

# /software-architecture:radar

Propose a ring change to the IP Technology Radar — adding a technology,
moving it between rings (Adopt / Trial / Assess / Hold), or removing it.

## Process

1. **Identify the technology** — name, category (Languages & Frameworks
   / Tools / Platforms / Techniques), proposed ring.

2. **Look up current state** — read
   `~/GitHub/software-architecture-excellence/docs/tech-context/radar.md`
   to see current ring placement (if any).

3. **Look up Thoughtworks signal** — invoke
   `software-architecture:technology-radar` to fetch the Thoughtworks
   ring assignment.

4. **Determine significance** — significant ring movements (Adopt ↔
   Hold, or anything changing default behavior across multiple repos)
   require a companion ADR in `software-architecture-excellence/docs/adr/`.

5. **Scaffold the changes** — propose:
   - The radar.md edit (add or move the row).
   - The ADR draft (SAE-NNN-).
   - Cross-references between them.

6. **Confirm before committing** — show both diffs; only commit on
   explicit user confirmation. Per global CLAUDE.md, this is a
   shared-state action.

## Arguments

`$ARGUMENTS` can include:
- `<technology> <ring>` — e.g., `Drizzle Trial`
- `<technology> remove` — propose removal
- Just `<technology>` — ask the user for the proposed ring

## See Also

- `software-architecture:technology-radar` — the skill that backs this command.
- Future ADR: radar-as-database (replaces markdown with structured store).
