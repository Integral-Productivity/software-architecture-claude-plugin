---
title: "Plugin hooks never fire when the manifest is at .claude-plugin/hooks.json"
date: 2026-10-30
category: integration-issues
module: software-architecture plugin / hooks
problem_type: integration_issue
component: tooling
severity: high
applies_when:
  - "A Claude Code plugin ships hooks"
  - "Hook tests pass but no hook output or log line appears in a real session"
  - "Before a catalog pin moves to a commit that adds or moves hooks"
related_components:
  - hooks
  - marketplace
tags:
  - claude-plugins
  - hooks
  - manifest
  - smoke-test
---

# Plugin hooks never fire when the manifest is at .claude-plugin/hooks.json

## Problem

From 0.1.0 to 0.1.0 at `2e0dfeb`, no hook of this plugin ever ran in a real session. The
governing-document anchor gate gave no warning, and `SA_ANCHORS_LOG` was never created, although
the settings were set and the scripts worked when run by hand.

## Root cause

Claude Code loads a plugin's hooks from `hooks/hooks.json`, unless `plugin.json` names a `hooks`
path. The manifest lived at `.claude-plugin/hooks.json`, which is never read. The unit tests read
the manifest from the same wrong path, so they passed.

Evidence: the session debug log has a `Loading hooks from plugin: <name>` line for each plugin
whose hooks load. It had none for software-architecture before the fix, and one after.

## Fix

PR #68 (v0.1.1): move the manifest to `hooks/hooks.json`, and add a test in
`test/manifest.test.mjs` that fails if `.claude-plugin/hooks.json` comes back or if `plugin.json`
redirects hooks. Bump the version so `/plugin update` picks up the change.

## Prevention

- Unit tests prove a script works, not that Claude Code loads it. Before a catalog pin moves to a
  commit that adds hooks, run a smoke test in a fresh session: check the `Loading hooks from
  plugin` line, then trigger one hook and check its output.
- Other plugins that copied this layout may have the same defect (product-architecture was checked
  in its own thread, 2026-10-30).
