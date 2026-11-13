---
title: ADR Reviewer Agent - Plan
type: feat
date: 2026-11-13
execution: code
---

# ADR Reviewer Agent - Plan

## Goal Capsule

- **Objective:** every ADR the plugin helps draft, change or audit gets an
  independent review of the document itself.
- **Authority:** [ADR-0008](../adr/0008-review-adr-documents-with-a-dedicated-agent.md).
- **Stop conditions:** stop if the reviewer would edit, move or delete an ADR,
  or if a hook would block a tool call.

## Feature detail (kept out of ADR-0008)

**Hand-off points**

| Path | Hand-off | Strength |
|---|---|---|
| Hook 10 `adr-pretooluse.sh` (new ADR) | Message tells the agent to run the reviewer before commit | Advice only (hooks warn, ADR-0005) |
| `/software-architecture:decide` | Dispatch step after the draft | Required step in the command |
| `/software-architecture:adopt` | Dispatch step after the draft | Required step in the command |
| `/software-architecture:adr-audit` | Dispatches the reviewer on the ADR directory | Required step in the command |
| `architecture-reviewer` agent | Delegates ADR files found in a diff | Required step in the agent |

**Agent definition** (`agents/adr-reviewer.md`)

- Model: Sonnet. Tools: Read, Glob, Grep, Bash (Bash only to read
  `git log -p --follow` for lifecycle history), Skill.
- Read-only by instruction: it never edits, moves or deletes a file.
- Eight checks: scope gate 1, scope gate 2, feature smell, other non-ADR
  content, anatomy, lifecycle, remember/revolt, radar evidence. Each check
  cites the section of the `architecture-decision-records` skill it applies.
- Output: one row per ADR with a verdict of Keep, Revise, Split or
  Reclassify, quoted evidence, and a proposed fix.

## Follow-ups

- A test that each check in `agents/adr-reviewer.md` cites a skill section,
  so the agent and the skill do not drift apart.
- Record the reviewer verdict in the PR body of each ADR PR, so the
  ADR-0008 revisit triggers can be measured.
