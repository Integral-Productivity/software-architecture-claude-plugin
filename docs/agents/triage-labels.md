# Triage labels

The five-state vocabulary this repo uses for issue triage. Every issue carries
exactly one state label. The states are about **what needs to happen next**, not
about severity or size — a one-line fix and a month of work sit in the same state
when both are fully specified.

| State | Means | Next actor |
|---|---|---|
| `needs-triage` | Not yet assessed. The default for anything filed without triage. | A triager |
| `needs-info` | Assessed, but cannot proceed — a reproduction, a decision, or missing context blocks it. | Whoever holds the missing information |
| `ready-for-agent` | Fully specified. An agent can pick it up and finish it without further human judgment. | Any agent |
| `ready-for-human` | Fully specified, but needs something an agent lacks — a physical gate, a credential, an identity or spend decision, or access it cannot hold. | A human operator |
| `wontfix` | Assessed and deliberately declined. Closed with the reasoning recorded. | Nobody |

## Choosing between `ready-for-agent` and `ready-for-human`

The test is **access and authority, not difficulty**. An agent with authenticated
tooling acts as the operator's hands, so "manual" or "operator-run" does not by
itself mean human-only. Reserve `ready-for-human` for the irreducible human step:
clicking a vendor's Create button, authorizing an SSO flow, choosing a domain
name, accepting a billing consequence, or minting a credential an agent cannot
mint for itself.

Everything downstream of such a step is repeatable, reversible, API-shaped work —
label that part `ready-for-agent` even when it sits in the same issue.

## Ground-truth before assigning a state

Issue text drifts from reality. Before labeling, verify the claim against the
live code, the live config, or the live service — do not trust the body. An issue
describing a defect that no longer reproduces is `wontfix` or a close, not
`ready-for-agent`.

State in the triage comment what you verified and what you found, so the next
reader knows the label rests on evidence rather than on the filer's description.

## Type labels

State labels compose with ordinary type labels (`bug`, `enhancement`,
`documentation`, and any `area:*` labels the repo uses). Apply both: the state
says what happens next, the type says what kind of work it is.
