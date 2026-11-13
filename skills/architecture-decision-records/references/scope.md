# ADR scope: what is, and is not, an ADR

An ADR is the durable record of an **architectural** decision: one that
shapes structure or quality attributes and would be costly to reverse
(Nygard, "Documenting Architecture Decisions", 2011; Ford et al.,
*Fundamentals of Software Architecture*, ch. 19). The ADR set is a decision
log. Every non-decision in it makes the real decisions harder to find.

## The two gates

**Gate 1: architectural scope.** At least one is true:

- **Repository architecture.** What the repository owns, how it is laid out
  (modules, packages, workspaces), its build and release surface, and its
  extension points. Example: "Skills, commands and hooks live in one plugin;
  product-specific skills live in the product's plugin."
- **Solution architecture.** The structure of the system the repository
  holds: style (layered, event-driven, modular monolith), component and
  service boundaries, data ownership, integration pattern, deployment
  topology.
- **Quality-attribute trade-off.** Which architectural characteristic wins
  when two conflict, and how it is measured. Example: "Hooks warn and never
  block, because adoption beats enforcement during the warn period."
- **Technology selection.** Language, framework, platform, datastore, or a
  library the code base is shaped around.
- **Contract.** An API, event or schema between parts or systems, and its
  evolution policy.

**Gate 2: the three triggers.** Hard to reverse, surprising without context,
and a real trade-off between genuine alternatives. All three.

## Not an ADR: common cases

| Signal in the draft | It is a… | Home |
|---|---|---|
| "Today we…", a list of steps done, a timeline | Worklog | PR body, issue, session ledger |
| "The command does…", "the table has columns…", "the user can…", acceptance criteria | Feature definition | PRD or specification in the product-management tool, or a GitHub issue |
| "Steps: 1. … 2. …" for a future change | Plan | `docs/plans/`, tracker |
| "To do X, run …" | Runbook or how-to | `docs/runbooks/`, `docs/` |
| "Client Y does not support Z, so …" with no alternative weighed | Lesson or gotcha | `docs/solutions/` |
| A table of facts read from a system, with no option chosen | Observed fact, inventory | Fact register, config, README |
| "Status: in progress", percent done | Status update | Tracker, PR |
| "Files use kebab-case" with no real alternative | Convention | `CONTRIBUTING.md`, lint rule |
| A choice local to one PR, reversible in one PR | Implementation choice | PR body |
| A policy about people or process with no structural effect | Governance or policy | The governance system that owns it |

## Edge cases

- **A fact that breaks an ADR's assumption.** The fact is not an ADR. If the
  broken assumption changes a decision, amend or supersede *that* ADR and cite
  the fact; record the fact itself in its register.
- **A lesson that forces a design rule.** The lesson goes to
  `docs/solutions/`. If you then *choose* a rule with alternatives (for
  example "every resource template declares a list callback"), the rule can be
  an ADR, and it cites the lesson.
- **A process decision that shapes structure.** Branching or release policy
  that changes what the repository can contain or how it is built is
  repository architecture (platform level). Meeting cadences are not.
- **Small but surprising.** If it fails "hard to reverse", a code comment or
  the PR body is enough, even when it is surprising.

## Feature smell: an ADR that reads like a spec

A decision about structure often arrives together with the feature that
needed it. Split them.

| In the ADR (structure and why) | In the spec or issue (what it does) |
|---|---|
| "Trigger the practice on file events, not only on prompt language, because…" | The hook's name, events, message text, opt-out key |
| "Configuration lives in ARCHITECTURE.md as ordered Markdown tables, because hooks parse it with awk" | The table's columns and allowed values |
| "A separate reviewer agent owns ADR-document review, because…" | The agent's checks and report format |

Smells, any one is enough to look again:

- The Decision section is a numbered list of things the system will do.
- It names commands, flags, fields, columns, screens or messages.
- It has acceptance criteria or user steps.
- Removing the options table would lose nothing, because no structural
  alternative was weighed.

Fix: keep one paragraph that names the structural choice, keep the options
and consequences, and link the spec or issue for the feature detail.

## When you decline to write an ADR

Say it in one line, with the gate that failed and the home:
"Not an ADR: no real alternative was weighed (gate 2). Recorded as a solution
note in `docs/solutions/…`."
