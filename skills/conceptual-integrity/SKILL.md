---
name: conceptual-integrity
description: >
  Run the placement fit check before new work lands in a repository or
  plugin. Use when about to add a new skill, command, agent, hook, ADR,
  module, or plugin; when asking "where should this live," "does this
  belong in this repo," or "which plugin owns this"; when a placement
  reminder hook fires; or when reviewing a PR that adds a capability.
  Reads the host's stated intent, searches for a prior placement decision,
  and returns one verdict — Strong, Weak, or Misfit — with evidence.
  Guards against putting work in the nearest repo instead of the right one.
status: draft
version: 1.0.0
---

# Conceptual Integrity — the placement fit check

Fred Brooks called conceptual integrity "the most important consideration
in system design": a system should reflect one set of design ideas, not a
pile of good but unrelated ones. Each repository, plugin, and service has
an intent. Work that does not serve that intent erodes it, even when the
work itself is good.

The common failure is convenience placement: an agent (or a person in a
hurry) puts a new capability in the repo that is already open, or in the
repo whose name sounds close. This skill replaces that habit with an
explicit check and a recorded verdict.

## When to run it

Run the check before you create a **new capability** in a host. A
capability is anything that adds a new thing the host can do or decides:

- a skill, command, agent, or hook in a plugin
- an ADR
- a plugin manifest (a new plugin)
- a new top-level module, package, or service in a product repo

An edit to an existing capability does not need the check, unless the
edit changes what the capability is for.

The `placement-pretooluse.sh` hook reminds you when a Write creates a new
capability file. The reminder arrives as the file is created, so run the
check before you write anything else.

## Step 1: Read the host's intent

Read these sources in this order. Stop adding sources once the intent is
clear, but always note which sources you read.

1. `STRATEGY.md` — purpose, boundaries, and non-goals
2. The purpose section of `CLAUDE.md` or `AGENTS.md`
3. The `description` in `.claude-plugin/plugin.json` (plugins only)
4. `README.md`
5. The host's ADRs (`docs/adr/`) and plans (`docs/plans/`)
6. The product spec in the product-management tool, when a connector to
   it is available — read it only after a repo source has stated the
   intent, and report any disagreement between the two
7. The repository name

**The repository wins.** When a repo source and the product spec
disagree, judge against the repo source (it is versioned with the code)
and report the disagreement in the output.

**No non-goals?** When the host states a purpose but no non-goals, judge
against the purpose. Do not judge against the current inventory ("it
already has a skill like this"): an inventory shows what is there, not
what belongs there.

## Step 2: Search for a prior placement decision

Someone may already have decided where this kind of work lives. Dispatch
`software-architecture:adr-historian` with the capability as the topic. It
searches:

- the host's own `docs/adr/`
- the sibling repos and the enterprise ADR home listed in the host's
  `ARCHITECTURE.md` (see `software-architecture:architecture-governance-levels`)

Report any repo that could not be reached as "not searched". Do not treat
an unsearched repo as having no decision.

A prior decision that names a home for this kind of work settles the
question, unless the decision has been superseded.

## Step 3: Decide the verdict

Return exactly one verdict.

| Verdict | Meaning | What to do |
|---|---|---|
| **Strong** | The capability serves the host's stated purpose, and nothing in its boundaries or prior decisions rules it out. | Continue. Say nothing beyond the recorded line. |
| **Weak** | The capability touches the host's purpose but fits another home at least as well, or the intent sources are silent. | Warn once. Name 1–3 better homes, each with one reason. Ask the user once which home to use, then follow the answer. |
| **Misfit** | The capability contradicts the host's purpose, a stated non-goal, or a prior placement decision. | Stop. Do not write further files. Remove any file you already created for it. Propose 1–3 better homes. Continue only on an explicit override from the user. |

### Rules for every verdict

- **Name similarity is never a reason.** "The repo is called
  `*-engineering` and this is engineering work" is not evidence.
- **"The repo that is open" is never a reason.** Convenience is the
  failure this check exists to prevent.
- **Cite evidence.** Every verdict quotes or links the intent source or
  the prior decision it rests on.
- **Name the alternatives you considered**, even for Strong. A Strong
  verdict with no alternatives considered is a guess.
- **A missing home is a finding.** If the best home does not exist yet
  (a new plugin or repo), say so. Do not force the work into the nearest
  host because the right one is missing.

### Overrides

The user may override a Weak or Misfit verdict. Record the override and
its reason with the verdict. Never infer an override from silence or from
an earlier approval of the work itself: approving the work is not
approving its placement.

## Step 4: Record the verdict

Put one `Placement fit:` line in the **commit message that adds the
capability**, and repeat it in the PR body or the ADR. Reviewers and
`software-architecture:architecture-reviewer` search for this marker.

```text
Placement fit: <Strong|Weak|Misfit> — <one-sentence reason, citing the intent source>
Homes considered: <home> (<why not>); <home> (<why not>)
Intent sources read: <STRATEGY.md, AGENTS.md, ...>; not searched: <repos>
Override: <none | user's reason>
```

### Example

```text
Placement fit: Misfit — STRATEGY.md says this plugin covers software
delivery workflow; a shared-drive bootstrap is workspace administration.
Homes considered: digital-workspace plugin (purpose matches: workspace
setup); engineering plugin (rejected: delivery workflow only).
Intent sources read: STRATEGY.md, AGENTS.md, plugin.json; not searched: none
Override: none — moved to the digital-workspace plugin.
```

## Output to the user

- **Strong:** no message. The recorded line is enough.
- **Weak:** one short warning, the alternatives, and one question.
- **Misfit:** what was stopped, what was removed, the evidence, and the
  alternatives. Ask whether to move the work or override.

## See Also

- `software-architecture:architecture-governance-levels` — which level and
  repo owns a decision; the placement check applies the same idea to
  capabilities.
- `software-architecture:adr-historian` — searches prior ADRs for a
  placement decision.
- `software-architecture:architecture-reviewer` — flags a new capability
  in a diff that carries no `Placement fit:` line.
- `/software-architecture:place` — runs this check on demand.
