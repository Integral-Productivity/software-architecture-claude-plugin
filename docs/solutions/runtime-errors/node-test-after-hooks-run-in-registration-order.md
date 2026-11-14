---
title: "A t.after() cleanup registered after a sandbox helper runs too late: the directory is already gone"
date: 2026-11-14
category: runtime-errors
module: test / anchors tests
problem_type: runtime_error
component: testing_framework
severity: medium
symptoms:
  - "A test that chmods a file to 000 fails with ENOENT on the restore step"
  - "The test passes when run as root and fails on every non-root CI runner"
root_cause: wrong_cleanup_order
resolution_type: code_fix
tags:
  - node-test
  - t-after
  - cleanup-order
  - file-permissions
  - ci
---

# A t.after() cleanup registered after a sandbox helper runs too late

## Problem

Test "reminder: an unreadable STRATEGY.md never fails the hook" in `test/anchors.test.mjs` made `STRATEGY.md` unreadable (`chmod 000`) and restored the mode in a `t.after()` hook. The `sandbox()` helper had already registered its own `t.after()` that removes the sandbox directory. In this suite the sandbox removal ran first, so the later restore `chmod` failed with ENOENT and the test went red.

As root the test did not fail, because root reads a mode-000 file and the failure path differs. Every non-root runner failed. `main` was red from PR #97 until PR #100.

## Solution

Restore the mode in a `try/finally` immediately after the call that needs the unreadable file. Do not rely on the order of `t.after()` hooks when another helper also cleans up the same path.

```js
await chmod(strategy, 0o000);
try {
  result = run(/* ... */);
} finally {
  await chmod(strategy, 0o644);
}
```

## Prevention

- Keep a cleanup step next to the change it undoes when another hook can delete the same path.
- Run permission tests as a non-root user before merging; root hides mode-000 failures.
