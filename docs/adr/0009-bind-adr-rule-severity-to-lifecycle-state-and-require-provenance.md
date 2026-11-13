# 9. Bind ADR rule severity to lifecycle state, and require provenance

Date: 2026-11-13

## Status

Proposed 2026-11-13

Provenance: [Integral-Productivity/software-architecture-claude-plugin#84](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/84),
[Integral-Productivity/software-architecture-claude-plugin#85](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/85)

Constrained by: [ADR-0005](0005-warn-before-change-when-governing-documents-are-unread.md)
(warn before block), [ADR-0006](0006-scope-adrs-to-architecture-and-load-higher-levels-in-panarchical-order.md)
(ADR lifecycle states), [ADR-0008](0008-review-adr-documents-with-a-dedicated-agent.md)
(judgment checks belong to the reviewer agent). The org-wide policy that makes
this binding beyond this plugin is proposed in
[software-architecture-excellence#133](https://github.com/Integral-Productivity/software-architecture-excellence/issues/133).

## Context

ADR-0006 and ADR-0008 gave the plugin rules for a well-formed ADR, but every
rule is advice: a hook message, a skill checklist, a reviewer verdict. Nothing
makes an accepted ADR keep its rules, so gaps accumulate. The first audit of
this repository's own ADRs (issue #86) found that all five pre-2026-11 ADRs had
an undated status and no link to the work item that asked for them.

Two forces pull against each other. A gate that blocks on day one punishes
existing ADRs and an ADR that is still being shaped. A rule that only ever
warns is ignored. The ADR lifecycle already marks when a record stops being a
draft: acceptance. A fixed curing period after acceptance gives the author time
to close the gaps before the rule becomes a gate.

Provenance is the second gap. An ADR that names no tracked work item cannot be
traced back to who asked for it and why, and the chain from a product or
governance need to a decision breaks. The owner's tracked homes are GitHub
issues, Productboard entities and GlassFrog projects.

This is costly to reverse once consumers depend on it: a CI gate that has gone
red in other repositories, and ADRs written to its rules, both change if the
mechanism changes.

## Decision

**The mechanical ADR rules are enforced by a fitness function whose severity
follows the ADR's lifecycle state, and an ADR must name a tracked work item by
ID before it can be accepted.** Gaps on a Proposed ADR are information; on an
Accepted ADR they warn during a curing period that starts at acceptance, and
fail CI after it. Finished states (Superseded, Deprecated, Rejected,
Reclassified) stay informational. Judgment rules, such as scope and the
feature smell, stay with the reviewer agent and are never a CI gate. A
repository adopting the function sets the day it adopted it, so existing ADRs
get the same curing period. The default curing period is 30 days (chosen by
the owner on 2026-11-13); which checks run, the accepted ID formats and the
output format are specified in issues #84 and #85 and in
`docs/scenarios/adr-fitness.feature`.

## Options considered

| Dimension | A. Advice only (hooks, reviewer) | B. Lifecycle-bound severity (chosen) | C. Hard CI gate from day one |
|---|---|---|---|
| Keeps accepted ADRs healthy | No: gaps accumulate | Yes, after the curing period | Yes |
| Cost to existing ADRs | None | A curing period from adoption | Red CI until all are fixed |
| Room to shape a draft | Full | Full while Proposed | None |
| Fits "warn before block" (ADR-0005) | Yes | Yes: warn, then block | No |
| Judgment checks in CI | n/a | No: reviewer only | Tempting, and noisy |
| Complexity | Lowest | One script, one CI step | One script, one CI step |
| Reversibility | High | High: drop the CI step | Medium: repositories adapt to a red gate |
| Provenance enforced | No | Yes | Yes |

A pre-commit hook was considered as a gate and rejected: it is local, opt-in
and bypassable, cloud agent sessions may not install it, and the session hook
already asks for provenance when an ADR is written.

## Consequences

- Easier: an accepted ADR cannot drift silently; every ADR traces to a work
  item; the severity tells the author how urgent a gap is.
- Easier: the same script can serve every repository with ADRs.
- Harder: an ADR cannot be accepted until its work item exists, which adds a
  step for small decisions.
- Harder: old ADRs need remediation within the curing period, and some have no
  work item to cite (issue #86).
- Limit: the function checks the format of an ID, not that the item exists.
- Cost: a team that ignores warnings for 30 days gets a red build.

## Revisit triggers

- More than 1 in 4 repositories that adopt the function have a red ADR build
  for over a week: the curing period or the checks are miscalibrated.
- An ID that does not exist passes the check in a recorded case: add an
  ID-resolution check.
- The devops-excellence fitness runner gains a severity model of its own:
  move the lifecycle mapping there and keep only the checks here.
