# 11. release-please writes the version and cuts the release tag

Date: 2026-11-13

## Status

Accepted 2026-11-13

Provenance: [Integral-Productivity/software-architecture-claude-plugin#67](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/67)

Amends: [ADR-0010](0010-pin-each-catalog-to-a-release-tag-with-a-lead-catalog.md),
which carries over the release-tag mechanics of the superseded
[ADR-0004](0004-distribute-through-marketplace-labs-pinned-to-release-tags.md)
(its manual release act; the tag pin and `stable` promotion stand).
Constrained by: [ADR-0010](0010-pin-each-catalog-to-a-release-tag-with-a-lead-catalog.md)
(catalogs pin release tags; this ADR only changes who makes the tag).

## Context

ADR-0004 made the release act manual: a person bumps `version` in
`.claude-plugin/plugin.json`, and a designated release actor pushes an
annotated `vX.Y.Z` tag. Ordinary agent credentials get HTTP 403 on a tag
push, so no agent session can finish a release.

That act did not happen. The only tag is `v0.1.0`. `plugin.json` says
`0.1.1`. Both catalogs pin commit `fd85240`, and eight commits, among them
feature PRs, merged after it. Claude Code caches an installed plugin by its
`version`, so a cloud session installs `0.1.1` at `fd85240` and never sees
the newer hooks. #67 has waited for a release since 2026-10-29.

The other Integral-Productivity plugins hit the same gap and closed it the
same way: release-please, run as the `ip-releaser` GitHub App, opens a
release PR on every push to `main`, and merging it writes the version and
creates the tag (for example self-org ADR-0010, after three untagged
releases). ADR-0004 and ADR-0010 both list "release-tag creation is
automated" as a revisit trigger.

This repository is public. The shared reusable workflow for release-please
forwards a vault-wide 1Password token, which a public caller must not do
(reusable-workflows RWF-004). `promote-stable.yml` here already uses a
token scoped to the single `ip-releaser` PEM.

## Decision

**release-please is the only writer of this plugin's version and the only
creator of its release tags.** People and agents describe changes with
Conventional Commits and never edit `.release-please-manifest.json`,
`version.txt` or `plugin.json` `$.version`. The release act is the merge of
the release PR. The org auto-merge workflow merges `release-please--*`
branches without a person, so every releasable push to `main` ships as a
release within minutes. A person holds a release by applying the
`hold-for-review` label to the release PR. The tag fires the existing
`promote-stable.yml` unchanged.

The workflow uses the scoped release token that `promote-stable.yml` already
holds, not the vault-wide token, until the shared reusable accepts the
scoped one.

## Options considered

| Dimension | A. Keep manual tags (ADR-0004) | B. release-please, scoped token (chosen) | C. release-please via the shared reusable, vault-wide token |
|---|---|---|---|
| Release actually happens | Has not, since 2026-10-29 | On each releasable push to `main` | On each releasable push to `main` |
| Who can release | Designated release actor only | Anyone whose PR merges to `main`; the release PR merges automatically | Same as B |
| Version drift (`plugin.json` vs tag) | Possible | One writer, no drift | One writer, no drift |
| Credential exposure on a public runner | None | One PEM (already exposed to promote-stable) | Every App PEM in the vault |
| Matches the other org plugins | No | Yes, mechanism; inline body | Yes, fully |
| Maintenance | None | Inline copy can drift from the reusable | None |

## Consequences

- Easier: no person has to remember to release. The version, tag,
  changelog and `stable` move together.
- Easier: catalog pins can name a real tag again, as ADR-0010 requires.
- Harder: this repo is Tier 3, and its `main` ruleset requires no status
  check. Auto-merge can therefore merge a release PR while the `Test`
  workflow is red, and a tag cannot be undone. This happened with
  `v0.2.0` on 2026-11-13 (a test-cleanup bug only). The gap is reported in
  devops-excellence#582.
- Limit: `hold-for-review` holds a release only when it is applied before
  auto-merge arms, which is seconds after the release PR opens
  (devops-excellence#582).
- Limit: the catalog bump is still a separate PR in each catalog
  (ADR-0010). This decision does not automate it.
- Cost: the workflow body is an inline copy that nothing checks against the
  shared reusable.

## Revisit triggers

- The shared reusable accepts the scoped release token: switch to a
  one-line `uses:` call.
- A release ships with a failing check, or a held release PR merges anyway.
- The org auto-merge stops merging `release-please--*` branches without a
  person: then the release act becomes a human merge again.
- `plugin.json` version differs from the latest tag on `main`.
