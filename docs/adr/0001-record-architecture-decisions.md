# 1. Record architecture decisions

Date: 2026-05-27

## Status

Accepted 2026-05-27. Amended 2026-11-13.

Provenance: [Integral-Productivity/software-architecture-claude-plugin#89](https://github.com/Integral-Productivity/software-architecture-claude-plugin/issues/89) (retrospective issue)

## Context

We need to record the architectural decisions made on this project.

## Decision

We will use Architecture Decision Records, as [described by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Consequences

See Michael Nygard's article, linked above. For a lightweight ADR toolset, see Nat Pryce's [adr-tools](https://github.com/npryce/adr-tools).

## Revisit triggers

- The repository adopts a different decision-record format (for example MADR),
  or the ADR rules in `software-architecture:architecture-decision-records`
  stop being Nygard-shaped.
- Decisions about the plugin start to be recorded somewhere other than
  `docs/adr/` of this repository.

## Amendment 2026-11-13

Added during the remediation of pre-2026-11 ADRs (#86), without a change to
the Decision: the status date, the provenance line (a retrospective issue,
because no work item existed at acceptance), the Revisit triggers section,
and the Nygard link, moved from the retired thinkrelevance.com address to the
same article on cognitect.com. The owner chose on 2026-11-13 to keep this
record as an ADR and not to reclassify it.
