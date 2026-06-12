# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Architecture practice

### Architectural characteristic
A non-domain quality the architecture must preserve as it changes — the "-ilities" such as modifiability, resilience, performance, observability, security, and cost.
*Avoid:* non-functional requirement.

Characteristics are elicited from stakeholder goals and prioritized, since only a few can be primary at once; each one worth preserving is given an explicit measurement so it can be expressed as a fitness function.

### Fitness function
An objective, usually executable test of an architectural characteristic, run continuously to catch drift before it ships.

A fitness function is *atomic* (asserts one characteristic) or *holistic* (measures emergent behavior across several), and *static* (reads source at rest) or *dynamic* (exercises a running system). A characteristic that is acknowledged but not yet enforced is recorded as a *declared gap* rather than left implicit.

### Evolutionary architecture
An architecture deliberately designed to support guided, incremental change across multiple dimensions, with fitness functions as the guidance mechanism that keeps change from degrading the characteristics that matter.

### Architectural trade-off
A forced choice between architectural options in which every direction sacrifices something — the working assumption that there is no free option, only a trade. Recurring trade-offs are organized into decision archetypes.

### Decision archetype
One of the recurring shapes an architectural trade-off takes — for example granularity, coupling and cohesion, data ownership, workflow coordination, and contract evolution — each carrying the forces that pull toward integration versus disintegration.
*Avoid:* pattern (overloaded elsewhere).

### Governance level
The altitude at which an architectural decision is owned and recorded: Enterprise (org-wide), Platform (cross-system), System (one product), Service (one component), or Code.

The level a decision belongs to determines which repository holds its ADR and which identifier prefix it carries; routing a decision to the wrong level is a recurring failure this vocabulary exists to prevent.

### Architecture Decision Record (ADR)
A durable record of a one-way-door decision — the context, the decision itself, the options weighed, and the triggers that would reopen it — written so a future reader understands not just what was decided but why.

Each ADR is routed to a governance level, which determines where it lives and how it is numbered.

### Technology radar
A ringed map that places a technology in one of four adoption rings — Adopt, Trial, Assess, or Hold — assessed against both the external (Thoughtworks) radar and the organization's own.

A **Hold** ring is an active instruction to avoid a technology, not merely the absence of an opinion; a conflict between the external and internal radar is resolved in favor of the organizational signal.

## Cross-plugin skill architecture

### Pointer-plus-delta skill
A skill that defers a generic method to an owning plugin's skill and carries only the content specific to its own domain — the *delta* — rather than re-stating the method. It is the complement of a single-source-of-truth owner: the owner holds the method; the pointer-plus-delta skill holds the specialization.

The dependency on the owner is load-bearing wherever the skill frames work: a consumer that loses access to the owner (owning plugin uninstalled, or drifted under it) degrades to a thinner skill exactly when it relies on the deferred method. Stripping a skill to a pointer is therefore only safe when the owner can be guaranteed present at the consumer's entry point.

### Decommissioned skill
A skill whose canonical name has been retired — typically because it was extracted into another plugin and renamed — so references to the old name are no longer valid.

Decommissioning is enforced, not merely announced: a fitness function fails when any surface still references a decommissioned name, and a registry redirect maps each old name to its successor. A name maps to a successor by *kind* (an ADR skill to the ADR successor, a generic-design skill to the design successors), not blanket to one target.
