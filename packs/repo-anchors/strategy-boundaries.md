---
title: Keep every change inside the Boundaries in the repository's STRATEGY.md
applies_when:
  - planning or reviewing a change in a repository that has a STRATEGY.md at its root
  - deciding where new code, a new script or new logic goes in the repository
  - adding a feature, dependency or integration the repository did not have before
tags: [strategy, boundaries, scope, governing-documents]
---

Read the `## Boundaries` section of `STRATEGY.md` at the repository root before
you decide. Each bullet is a limit the repository's owner set on what the
repository does and where things go.

- In a plan, name the Boundary that governs each decision about scope or
  placement, quote it, and say how the decision stays inside it.
- In a review, flag a change that crosses a Boundary as a finding. Quote the
  Boundary and say which part of the diff crosses it. A change that crosses a
  Boundary needs a STRATEGY.md change or an ADR first, not a workaround.
- If STRATEGY.md has no `## Boundaries` section, say so once and continue.
