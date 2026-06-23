---
name: review
description: Architectural review of the current diff against existing ADRs, fitness functions, and the technology radar. Dispatches the architecture-reviewer agent (Opus).
---

# /software-architecture:review

Run an architectural review of the current diff. The
`architecture-reviewer` agent (Opus) examines:

- Prior ADRs that govern the changed code
- Fitness functions impacted
- Radar entries crossed (e.g., new Hold-ring dep)
- Decisions made implicitly that should be ADR'd

## Process

1. **Check repo state** — ensure there's a non-trivial diff.
   - `git diff main..HEAD` (or current branch base)
   - If diff is small (< 50 lines, no new files), warn that the
     architecture-reviewer may have limited material.

2. **Identify base branch** — usually `main`. If working in a worktree
   or stacked PR, identify the right base.

3. **Dispatch `architecture-reviewer` agent (Opus)** — pass:
   - The diff
   - The routing table from `ARCHITECTURE.md` (if present)
   - Direct reference to the ADR homes and radar location named in
     `ARCHITECTURE.md` — typically:
     - The enterprise / cross-cutting standards repo's `docs/adr/`
     - The platform / DevOps repo's `docs/adr/`
     - Current repo's `docs/adr/`
     - The org's custom radar file (if configured)

4. **Surface the report** — agent returns a markdown report with:
   - **Prior ADRs touched** (with links)
   - **Fitness functions impacted** (with paths)
   - **Radar conflicts** (Hold-ring deps added, etc.)
   - **Implicit decisions** (decisions made in the diff that should be
     ADR'd)
   - **Suggested follow-up actions**

5. **Offer next steps** — for each implicit decision, offer to launch
   `/software-architecture:decide` to capture it.

## Auto-Firing via Hook 5

This command can also be auto-fired by Hook 5 when the user is about to
call `ExitPlanMode` with a non-trivial diff in the worktree. The
agent's report is injected as a system reminder for Claude to surface
alongside the plan.

## Model

The `architecture-reviewer` agent defaults to **Opus**. For small diffs,
the caller can override to Sonnet.
