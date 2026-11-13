# 8. Review ADR documents with a dedicated agent

Date: 2026-11-13

## Status

Accepted 2026-11-13 (proposed 2026-11-13; revised before acceptance, after
an `adr-reviewer` run on this record: feature detail moved to the plan,
links and options completed). The implementation merged with the proposal
in PR #79.

Provenance: [Integral-Productivity/software-architecture-claude-plugin#83](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/83)

Extends [ADR-0002](0002-establish-software-architecture-plugin-and-its-scope.md)
(adds a fourth subagent to the set it lists).
Constrained by: [ADR-0005](0005-warn-before-change-when-governing-documents-are-unread.md)
(hooks warn, never block), [ADR-0006](0006-scope-adrs-to-architecture-and-load-higher-levels-in-panarchical-order.md)
(scope test, ADR-file hook), [ADR-0007](0007-draft-technology-adoption-adrs-from-configured-radars.md)
(adoption drafting path).
Plan: [docs/plans/2026-11-13-adr-reviewer-plan.md](../plans/2026-11-13-adr-reviewer-plan.md).

## Context

ADR-0006 gave the plugin a scope test for ADRs. Applying it to the first two
ADRs drafted under it, ADR-0006 and ADR-0007, exposed a further failure mode:
Decision sections that read like feature specifications. Both had to be
trimmed before acceptance. The drafting session did not catch this, because
it was checking its own work.

Nothing checks an ADR as a document. `architecture-reviewer` reviews a code
diff against ADRs, fitness functions and the radar; `adr-historian` finds
prior decisions. Neither judges whether an ADR is in scope, well formed,
linked through its lifecycle, and free of feature detail. Reviewing a record
and reviewing code against records need different inputs (one ADR or an ADR
directory, versus a diff) and different judgments. CONTRIBUTING.md admits a
new agent when significant context isolation is needed; an independent second
read is exactly that.

The choice is costly to reverse once made: every plugin path that drafts,
changes or audits an ADR comes to depend on where review lives.

## Decision

**ADR-document review has one executor: a reviewer agent separate from
`architecture-reviewer`. Every plugin path that drafts, changes or audits an
ADR hands the document to it instead of checking it inline.** The ADR skill
stays the single source of the rules and the agent is their single executor,
so a rule added to the skill reaches every path without editing each one, and
`architecture-reviewer` stays focused on code against decisions. The hand-off
is a dispatch step in commands and agents, and only advice in hooks, which
stay warn-only. Which paths hand off, and the agent's checks, model and report
format, are specified in the plan, not here.

## Options considered

| Dimension | A. Extend architecture-reviewer | B. Separate reviewer agent (chosen) | C. Checklist in the skill only |
|---|---|---|---|
| Cohesion | Low: code review and document review mixed | High: one concern per agent | High in the skill, but no executor |
| Input fit | Diff-shaped; an ADR directory is awkward | One ADR or a directory | Whatever the drafting session holds |
| Context isolation (CONTRIBUTING.md) | Yes, but shared with code review | Yes | No: runs in the author's context |
| Independent second read | Yes | Yes | No: the author checks itself |
| Judgment quality | Strongest model, shared attention | Smaller model, single focus | Same model as the author |
| Complexity | One larger agent prompt | One more agent, several call sites | Lowest |
| Reversibility | High | Medium: call sites to repoint | High |
| Operational overhead | Large review run per ADR check | One small dispatch per drafted ADR | None |
| Places to keep in sync | One agent and the skill | Agent checks and the skill | Skill only |

## Consequences

- Easier: every plugin path that dispatches the reviewer applies the same
  scope, feature-smell and lifecycle rules.
- Harder: the agent's checks restate the skill's rules, so the two change
  together. The plan names a test to keep them aligned.
- Harder: `architecture-reviewer` depends on the reviewer for ADR files in a
  diff.
- Limit: the hook path is advice only. An ADR written with the `adr` hook key
  opted out, or by a session that ignores the advice, gets no review until an
  audit. The audit is the backstop.
- Limit: read-only is held by the agent's instructions, not by its tools; it
  keeps a shell to read file history.
- Cost: one dispatch per drafted ADR, on a smaller model that may miss some
  judgment calls.

## Revisit triggers

- In 15 ADR PRs where the reviewer ran (verdict recorded in the PR body), the
  user overrides the verdict in more than 1 in 3. If the overrides are about
  rule wording, recalibrate the skill. If they cite missing code context,
  re-evaluate option A.
- An `adr-audit` finds that more than 1 in 4 ADRs accepted after this one
  carry a finding the reviewer would have raised: the advisory hand-off is
  skipped. Evaluate a required review step or a CI check.
- Claude Code ships a way to run a skill checklist in an isolated context
  without a subagent: re-evaluate option C.
