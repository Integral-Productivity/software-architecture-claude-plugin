# 10. Pin each catalog to a release tag, with one lead catalog

Date: 2026-11-13

## Status

Proposed 2026-11-13

Provenance: [Integral-Productivity/software-architecture-claude-plugin#93](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/93)

Supersedes, on acceptance: [ADR-0004](0004-distribute-through-marketplace-labs-pinned-to-release-tags.md)
(its single-catalog pin rule; the release-tag mechanics carry over).
Constrained by: [ADR-0003](0003-single-source-architecture-method-and-repoint-consumers.md)
(this repository owns the version contract toward consumers),
[ADR-0009](0009-bind-adr-rule-severity-to-lifecycle-state-and-require-provenance.md)
(provenance and lifecycle).

## Context

ADR-0004 closed the version contract that ADR-0003 left open: "the catalog
entry pins to a release tag", and a bump is an explicit PR in the catalog. It
assumed one catalog, `marketplace-labs`, and named a second catalog as a
revisit trigger. That trigger has fired: on 2026-10-29 the plugin's entry was
re-pinned in both `marketplace-labs` (marketplace-labs#46) and
`marketplace-labs-public` (marketplace-labs-public#13), as #67 records.

With two catalogs, ADR-0004 leaves three questions open:

- Must both catalogs pin the same tag, or may they differ?
- When they differ, which one is authoritative for "what version is
  released"?
- How far may a catalog fall behind?

A release that runs on one catalog before it reaches the next limits the
blast radius of a broken release to that catalog's consumers. Against that,
every lag is a second version in the field, and ADR-0004 already named "two
pins for one repo" as a cost. README.md and AGENTS.md name `marketplace-labs`
as the install source, so its consumers already get releases first in
practice.

Since 2026-10-29 both catalogs pin a commit SHA, so that PR #64 reached
consumers. That interim deviation is tracked in #67 and is outside this
decision.

This is costly to reverse once consumers follow it: each catalog's consumers
learn which version they get from the policy, and the release routine is
built around it.

## Decision

**Every catalog that lists this plugin pins a release tag, and
`marketplace-labs` leads.** The lead catalog receives each release first and
is authoritative for what is released. Every other catalog follows: it pins
only a tag the lead has served for at least a soak period, and it never falls
behind the lead by more than a lag bound. ADR-0004's release-tag mechanics
carry over unchanged.

## Options considered

| Dimension | A. Lockstep: all catalogs pin the same tag | B. Lead catalog, followers soak (chosen) | C. Each catalog sets its own policy |
|---|---|---|---|
| Versions in the field | One | Two at most, for a bounded time | Unbounded |
| Blast radius of a bad release | Every catalog at once | Lead catalog only, during the soak | Depends on each catalog |
| Release cost | One bump PR per catalog, same day | One bump PR per catalog, staggered | One bump PR per catalog, uncoordinated |
| "What is released?" | Any catalog | The lead catalog | No single answer |
| Fits ADR-0003 version contract | Yes | Yes: the lead is the contract | Weakly: the contract fragments |
| Complexity | Lowest | A soak rule to follow | A policy per catalog |
| Reversibility | High | High: set the soak to 0 for lockstep | Medium: catalogs drift apart |

Amending ADR-0004 to lockstep (option A) was the recommended path before the
owner chose to supersede, so that a catalog serving a less-prepared audience
can lag on purpose.

## Consequences

- Easier: a release has a defined first audience, and a regression found
  there does not reach the follower catalogs.
- Easier: "what is released" has one answer, the lead catalog's tag.
- Harder: a fix reaches follower consumers up to a soak period later than
  lead consumers.
- Harder: two tags can be live for a time, so a support question must ask
  which catalog the consumer installed from.
- Limit: nothing enforces the soak or the lag bound. A catalog fitness check
  belongs in the catalog repositories, not here.
- Cost: one bump PR per catalog per release, as under ADR-0004, now staggered.
- Defaults at acceptance, which are settings and not the decision: a soak
  period of 7 days and a lag bound of one minor version. When the two clash,
  the follower pins the newest tag that has finished its soak. The release
  routine holds the current values.

## Revisit triggers

- A regression reaches a follower catalog after it passed the soak: the soak
  is too short, or the lead catalog's audience does not exercise the plugin.
- A follower lags past the bound in practice: the policy is not followed, and
  needs a check in the catalog repositories or a lockstep rule.
- A third catalog lists the plugin, or a catalog changes its visibility
  (public or private).
- Release-tag creation is automated, or the designated-actor gate changes
  (carried over from ADR-0004).
- `plugin.json` version drift against the published tag is observed in
  practice (carried over from ADR-0004).
