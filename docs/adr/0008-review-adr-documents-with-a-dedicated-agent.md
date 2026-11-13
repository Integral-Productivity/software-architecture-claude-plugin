# 8. Review ADR documents with a dedicated agent

Date: 2026-11-13

## Status

Proposed

Constrained by: [ADR-0006](0006-scope-adrs-to-architecture-and-load-higher-levels-in-panarchical-order.md).

## Context

ADR-0006 gave the plugin a scope test for ADRs, and the owner then found a
further failure mode in its first two outputs: ADRs whose Decision section
reads like a feature specification. Nothing checks an ADR document as a
document. `architecture-reviewer` reviews a code diff against ADRs, fitness
functions and the radar; `adr-historian` finds prior decisions. Neither
judges whether an ADR is in scope, well formed, linked through its
lifecycle, and free of feature detail. Reviewing a record and reviewing code
against records need different inputs (one ADR or an ADR directory, versus a
diff) and different judgments.

## Decision

**ADR-document review is a separate, read-only agent, and the other ADR
entry points (the ADR-file hook, `decide`, `adopt`, `adr-audit`, and
`architecture-reviewer` when a diff contains ADR files) delegate to it.**
This keeps one owner for the ADR quality rules, so a rule added to the ADR
skill is applied in every path, and keeps `architecture-reviewer` focused on
code against decisions. The agent's checks and report format are its own
definition (`agents/adr-reviewer.md`), not part of this decision.

## Options considered

| Dimension | A. Extend architecture-reviewer | B. Separate adr-reviewer agent (chosen) | C. Checklist in the skill only |
|---|---|---|---|
| Cohesion of each agent | Low: code review and document review mixed | High | n/a |
| Input fit | Diff-shaped; an ADR directory is awkward | ADR or directory | n/a |
| Independent second read of a draft | Yes | Yes | No: the author checks itself |
| Cost per run | Opus for every ADR check | Sonnet, smaller context | None |
| Places to keep in sync | One large agent | Two agents, one owner per concern | Skill only |

## Consequences

- Easier: every ADR path gets the same review; the feature smell, scope and
  lifecycle rules have one executor.
- Harder: one more agent to maintain, and architecture-reviewer depends on
  it for ADR files in a diff.
- Cost: a dispatch per drafted ADR.

## Revisit triggers

- The agent's findings are overridden by the user in more than 1 in 3
  reviews over 15 reviews: the rules are miscalibrated.
- Claude Code gains a native document-review mechanism that runs skill
  checklists without a subagent.
