---
name: place
description: Run the placement fit check for a new capability. Reads the host's stated intent, searches prior placement decisions, and returns a Strong, Weak, or Misfit verdict with evidence and alternative homes.
---

# /software-architecture:place

Decide where a new capability belongs before you build it, and record
the verdict.

## Process

1. **Name the capability** — restate it as one sentence: what it does,
   and the host you propose to put it in. If the host is not named, use
   the current repository and say so.

2. **Run the check** — invoke `software-architecture:conceptual-integrity`.
   It reads the host's intent in order (STRATEGY.md, CLAUDE.md or
   AGENTS.md, plugin.json, README, ADRs and plans, the product spec,
   the repo name), and dispatches `adr-historian` for prior placement
   decisions.

3. **Report the verdict** — show the verdict, the evidence, the homes
   considered, and any source that could not be searched.

4. **Act on the verdict**:
   - **Strong** — continue with the work.
   - **Weak** — ask the user once which home to use.
   - **Misfit** — stop, and ask whether to move the work or override.

5. **Record it** — put the `Placement fit:` line in the commit message
   that adds the capability, and repeat it in the PR body or the ADR.

## Arguments

If invoked with `$ARGUMENTS`, treat it as the capability description.
Otherwise, ask the user for it.

## See Also

- `software-architecture:decide` — write an ADR when the placement itself
  is a decision worth recording.
- `software-architecture:review` — review a diff; flags new capabilities
  with no `Placement fit:` line.
