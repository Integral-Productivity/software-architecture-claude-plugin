---
name: fitness
description: Author or run architectural fitness functions in the current repo. Dispatches the fitness-author agent in a worktree to scaffold new checks matching the repo's existing style.
---

# /software-architecture:fitness

Add or run fitness functions for an architectural characteristic.

## Process

1. **Determine intent** — author new or run existing?
   - "Author" path: continue below.
   - "Run" path: detect runner (`npm test`, `pnpm fitness`, `make
     fitness`) and execute. Surface results.

2. **Identify the characteristic** — what architectural property is this
   function protecting? If unclear, invoke
   `software-architecture:architectural-characteristics` to elicit.

3. **Study existing patterns** — read the repo's `fitness/` directory
   (or equivalent) to identify:
   - Runner (TypeScript `node:test`, Python pytest, custom shell)
   - File / naming convention
   - Test structure

4. **Dispatch `fitness-author` agent** — with `isolation: "worktree"` so
   output is reviewable like a PR. Pass the characteristic, the example
   patterns observed, and the test runner.

5. **Review output** — present the worktree path and diff. User decides
   whether to merge into main branch.

6. **Baseline + invert** — if the test PASSES against current code (good
   — characteristic is already preserved), offer to add an inverted
   sentinel that catches *future* regressions. This is the TDD-style red
   step for evolutionary architecture.

## Worktree Output

The `fitness-author` agent returns the worktree path. The plugin's user
should:
- Review the diff: `git diff main..<worktree-branch>`
- Test the function: `cd <worktree> && <runner>`
- Merge if good: `git merge <worktree-branch>` (from main)
- Discard if not: `git worktree remove <worktree>`

## Arguments

If invoked with `$ARGUMENTS`, treat as the characteristic name (e.g.,
`/software-architecture:fitness modifiability`).
