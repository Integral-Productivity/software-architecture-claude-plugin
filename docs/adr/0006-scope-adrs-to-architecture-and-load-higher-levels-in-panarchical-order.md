# 6. Scope ADRs to architecture, trigger on ADR files, and load higher levels in panarchical order

Date: 2026-11-13

## Status

Proposed (revised 2026-11-13 before acceptance: feature detail moved to the plan)

Extends [ADR-0005](0005-warn-before-change-when-governing-documents-are-unread.md)
(warn-mode hooks) to ADR files. Changes the ADR branch of the placement
reminder (Hook 9) without changing the placement rule it carries. Plan:
[docs/plans/2026-11-13-adr-lifecycle-and-panarchical-context-plan.md](../plans/2026-11-13-adr-lifecycle-and-panarchical-context-plan.md).

## Context

The plugin's purpose is to put the right architectural context in front of an
agent at the moment of change (STRATEGY.md). For ADRs it does this through
prompt language only: the `architecture-decision-records` skill description
and the Hook 2 regex. Three problems follow.

1. **Scope is undefined.** The skill says to write an ADR "whenever an
   architectural decision is being made" and "if you are not sure, lean toward
   writing it". It does not say what makes a decision architectural, and it
   names no other home for a record. Consuming repositories now hold ADRs that
   record an observed fact, a client-behavior lesson or a work log. Each one
   lowers the signal of the decision set that the `adr-historian` agent and a
   future reader depend on.
2. **Writing an ADR does not trigger the ADR practice.** An agent can write
   `docs/adr/NNNN-*.md` directly (inside `ce-work`, `lfg`, or after a standing
   "offer an ADR" instruction) with no matching prompt phrase. The only hook
   that fires is the placement reminder, which checks the host, not the scope,
   the lifecycle or the higher-level ADRs. No hook fires on an Edit, where
   status changes and supersession happen.
3. **Higher-level ADRs have a location but no order or force.**
   `ARCHITECTURE.md` routes decisions to levels, but it does not say which
   level to read first, which levels bind and which advise, or where a local
   decision that should change a higher level goes.

Panarchy (Gunderson and Holling, *Panarchy*, 2002) describes nested adaptive
cycles that run at different speeds. Two cross-scale links matter here.
*Remember*: the slower, wider level supplies memory and constraints to the
faster, narrower level as it reorganizes. *Revolt*: a change in the faster,
narrower level can cascade up and release the slower level. In ADR terms, an
enterprise ADR is remembered by a repository decision, and a repository
decision that proves a better way is a revolt that should reach the enterprise
level through a defined channel, not by silent drift.

## Decision

**The ADR practice is triggered by ADR file events as well as by prompt
language, and the higher-level ADR homes a repository must read are
configured as ordered, binding-or-advisory data in `ARCHITECTURE.md`.** The
plugin reacts at the moment an ADR file is created or changed, in a warn-only
hook, instead of relying on the agent to recognise decision language. The
order of the configured homes encodes panarchy's remember link (slowest,
widest level first), and each binding home names a channel for the revolt
link, so a local departure is surfaced upward instead of drifting. Feature
detail (the hook, its messages, the table columns, the scope test wording,
the audit command) is specified in the plan linked above, not here.

## Options considered

| Dimension | A. Description and Hook 2 text only | B. ADR-file hook + scope and lifecycle in skill + Context Sources (chosen) | C. Blocking CI check on ADR content |
|---|---|---|---|
| Fires when an ADR is written with no decision phrase | No | Yes | Only at PR time |
| Fixes noise at the source | Partly | Yes, scope test at write time | Late, after the work |
| Fits "warn before block" Boundary | Yes | Yes | No warn period yet |
| Configuration surface | None | `ARCHITECTURE.md` (existing) | CI config |
| Hooks stay local and stateless | Yes | Yes: config re-read per call | n/a |
| Cost | Low | Medium: one hook, one command, prose | High: a judgment is hard to test |
| Reversibility | High | High: opt-out key `adr` | Medium |

A YAML block or a separate config file was considered for Context Sources and
rejected: hooks are bash with `jq`, a fixed-column Markdown table parses with
`awk`, and `ARCHITECTURE.md` is already the configuration surface named in
the Boundaries.

## Consequences

- Easier: a session that writes an ADR gets the scope test and the higher
  levels at that moment; non-ADR records get a named home; a repository can
  review its ADR set as one portfolio.
- Easier: a local decision that departs from a binding higher-level ADR is
  recorded as `Deviates from:` and has a channel upward.
- Harder: one more hook in every consumer session. It is silent outside ADR
  files and has an opt-out key.
- Harder: `ARCHITECTURE.md` gains a table whose column order is a contract.
  A change to the columns needs a superseding ADR.
- Cost: the scope test is a judgment; agents can still misclassify. The audit
  is the backstop.

## Revisit triggers

- Hook 10 fires on more than 1 in 5 ADR writes where the agent then decides
  the record is not an ADR and the user overrides that, over 20 recorded
  cases: the scope test is too strict.
- An audit of a consuming repository finds more than 1 in 4 ADRs created
  after this ADR fail the scope test: the hook is not changing behavior.
- Claude Code ships a native hook or skill trigger on file paths that makes
  the hook redundant.
