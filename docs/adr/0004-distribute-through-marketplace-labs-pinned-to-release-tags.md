# 4. Distribute through the marketplace-labs catalog, pinned to release tags

Date: 2026-08-22

## Status

Accepted

Extends [0003](0003-single-source-architecture-method-and-repoint-consumers.md).
Supersedes the distribution mechanism described in
[0002](0002-establish-software-architecture-plugin-and-its-scope.md).

## Context

[ADR-0002](0002-establish-software-architecture-plugin-and-its-scope.md)
decided this plugin would be "published from its own repository and installed
as a Claude Code plugin marketplace." [ADR-0003](0003-single-source-architecture-method-and-repoint-consumers.md)
left the version contract deliberately open, recorded that it is owned here,
and listed as a revisit trigger: "The distribution mechanism gains (or is
decided to need) tag/ref pinning for plugin references." That trigger has
fired, and three facts settled it.

**The ADR-0002 mechanism never worked.** `/plugin marketplace add <repo>`
requires a `.claude-plugin/marketplace.json` at the repo root. This repo has
never carried one — absent at HEAD and absent at every revision in history.
The install instructions in README.md, AGENTS.md, and CONTRIBUTING.md were
therefore not merely indirect, they did not resolve. The decision was recorded
but never realized.

**A catalog now exists.** The plugin is published in the public
`Integral-Productivity/marketplace-labs` marketplace, registered as
`integral-productivity-labs`. Consumers add that marketplace and install
`software-architecture@integral-productivity-labs`.

**An unpinned catalog entry reproduces exactly the risk ADR-0003 named.** A
consumer floating on this repo's `main` HEAD degrades silently when a skill is
renamed or a section removed. The catalog entry was pinned to an immutable
commit SHA as an interim measure, which froze the risk but is not a
human-legible version contract — a consumer reading `1d53f34` learns nothing
about what they are installing or whether they are behind.

The plugin now cuts release tags and maintains a `stable` branch, so both a
tag pin and a branch pin are available. They differ in who initiates a
version change: `stable` advances on every release automatically, a tag pin
changes only when someone opens a PR against the catalog.

## Decision

**Distribution is through the `marketplace-labs` catalog.** This repo does not
publish itself as a marketplace and carries no `marketplace.json`. Nothing
should add one — its absence is the decision, not an oversight.

**The catalog entry pins to a release tag.** Not `main`, not `stable`, not a
commit SHA. Every version the catalog serves is a tag a human chose.

**Releases are annotated `vMAJOR.MINOR.PATCH` tags cut on `main`**, matching
`plugin.json`'s `version`. Pushing one fires `promote-stable.yml`, which
fast-forwards `stable` to the tagged commit as the designated release actor.

**`stable` is maintained but is not the consumer pin.** It exists for
consumers who prefer to track releases automatically, and as the promote
target that proves a release completed. The catalog does not use it.

**Bumping the catalog is an explicit PR** against `marketplace-labs`, opened
after the tag exists.

## Consequences

- **The version contract ADR-0003 deferred is now closed.** A consumer reads
  `ref: v0.1.0` and knows what they have.
- **Breaking renames land behind a version boundary.** The rename and
  deprecation obligations ADR-0003 assigned to this repo become expressible:
  a breaking change is a major bump, and consumers move when they choose.
- **Every release costs a second PR, in another repo.** A fix merged here does
  not reach consumers until the catalog entry is bumped. This is the price of
  the explicit-bump property, and it is a real lag — the SHA pin had the same
  lag without the legibility.
- **Releases require a designated actor.** Tag creation on this repo is
  refused for ordinary write credentials (an agent session with push access to
  branches received HTTP 403 pushing `v0.1.0`), consistent with the
  bypass-actor pattern the org already applies to the protected `stable`
  branch. Release cutting is therefore not delegable to any contributor with
  write access, and automation that assumes otherwise will fail at the push.
- **`plugin.json`'s `version` and the tag must be kept in step by hand.**
  Nothing enforces the match. A tag that disagrees with the manifest it ships
  is a silent inconsistency for whoever reads the installed plugin.
- **Two pins now exist for one repo.** `stable` and the catalog's tag can
  diverge — they do so by design between a release and its catalog bump — so
  "what version is deployed" has two answers depending on which a consumer
  followed. The catalog is authoritative for `marketplace-labs` consumers.

### Revisit triggers

- The catalog-bump lag causes a consumer to sit on a known-broken release
  long enough to matter, making `ref: stable` the better trade.
- A second catalog (core, or another labs marketplace) lists this plugin,
  so "the catalog entry" stops being singular.
- Release-tag creation is automated, or the designated-actor gate changes.
- `plugin.json` version drift against the published tag is observed in
  practice, warranting a CI fitness check rather than a convention.
