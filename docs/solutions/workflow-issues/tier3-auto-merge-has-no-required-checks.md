---
title: "On a Tier 3 repo, auto-merge merges seconds after it arms, so hold-for-review and red CI do not stop a merge"
date: 2026-11-14
category: workflow-issues
module: release / org auto-merge
problem_type: workflow_issue
component: ci
severity: high
symptoms:
  - "A PR with the hold-for-review label merges anyway"
  - "A release-please PR merges about 40 seconds after it opens while a test is red on main"
  - "Turning auto-merge off on the PR does not prevent the merge"
root_cause: missing_required_checks
resolution_type: process_change
tags:
  - auto-merge
  - rulesets
  - release-please
  - hold-for-review
  - required-checks
---

# On a Tier 3 repo, auto-merge merges seconds after it arms

## Problem

The `main` ruleset for Tier 3 repos (devops-excellence `rulesets/main-branch-tier3.json`) has no required status checks. When the org auto-merge job arms auto-merge on a PR, GitHub has nothing to wait for and merges at once. So:

- PR #98 merged although it had the `hold-for-review` label and auto-merge had been turned off by hand. The org job re-armed it first.
- Release PR #99 (v0.2.0) merged 40 seconds after it opened, while test 59 was red on `main`.

## Solution

Treat every merge to `main` in this repo as a release. Keep `main` green before a releasable change merges, because nothing in the merge path checks it. To hold a release, add `hold-for-review` before the release PR opens; the label is a request, not a gate. ADR-0011 records this. The proper fix (required checks, or an auto-merge job that honors the label) belongs to devops-excellence; see devops-excellence#582.

## Prevention

- Before a PR that will trigger a release, confirm `Test` is green on `main`.
- Do not assume a label or a disabled auto-merge holds a PR on a Tier 3 repo.
