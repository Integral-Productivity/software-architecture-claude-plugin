# Technology-adoption ADRs, drafted from the radars

A technology selection passes gate 1 of the scope test. Whether it needs an
ADR still depends on gate 2: a library the code is shaped around, a platform,
a datastore or a language usually does; a small utility you can swap in one
PR usually does not.

The radars are the evidence. Draft the ADR from them, not from memory.

## 1. Find the radars

Read the `## Radar Sources` table in `ARCHITECTURE.md`, in its Order. Each
row is one radar:

```markdown
## Radar Sources

| Order | Radar | Location | Kind | Mode |
|---|---|---|---|---|
| 1 | Org radar | <path or URL to radar.md> | file | binding |
| 2 | Org radar service | <MCP server name> | mcp | binding |
| 3 | Thoughtworks | https://www.thoughtworks.com/radar | thoughtworks | advisory |
```

- **Kind** `file`: a Markdown radar in the `software-architecture:technology-radar`
  format. `url`: the same, fetched. `mcp`: a radar service reached through an
  MCP server (use its lookup tool, for example a "lookup technology" tool).
  `thoughtworks`: the public Thoughtworks radar.
- **Mode** `binding`: the organization's own placement; a departure needs a
  `Deviates from:` line. `advisory`: industry signal.
- With no table, fall back to `SA_RADAR_PATH`, a radar named in
  `ARCHITECTURE.md`, then Thoughtworks alone, and say which radars were not
  configured. A radar you could not reach is "not checked", never "not on
  the radar".

## 2. Look up each option on each radar

Use `software-architecture:technology-radar` for every option, the chosen one
and the alternatives. Record ring, quadrant, movement (new, moved in, moved
out, stable), edition or date, and the rationale.

## 3. Let the ring shape the ADR

| Org ring of the chosen option | What the ADR must add |
|---|---|
| Adopt | Short ADR. Cite the radar entry; focus on why this option over the other Adopt options. Often gate 2 fails: then no ADR. |
| Trial | Trial scope (which part of the system), success and exit criteria, a review date, and who reports the result to the radar owner. |
| Assess | Usually a spike, not an ADR. Write an ADR only if you adopt now; then treat it as Trial and say why you skip Assess. |
| Hold | A `Deviates from:` line naming the Hold entry, the reason the Hold does not apply here, the containment (where it may be used), and an upstream proposal offered through the radar's revolt channel. |
| Not on the org radar | Treat as Assess. Offer `/software-architecture:radar` to propose a ring, so the next decision has evidence. |

When the org radar and Thoughtworks disagree, the org radar wins for the
decision (CONCEPTS.md, Technology radar); name the tension in Consequences.

## 4. Template sections to add

Add these to the standard six-section anatomy:

```markdown
## Radar evidence

| Option | <Radar 1> | <Radar 2> | Thoughtworks | Movement |
|---|---|---|---|---|
| <chosen> | Trial (2026-10) | — | Adopt (Vol. 33) | moved in |
| <alternative> | Hold (2026-04) | — | Assess (Vol. 33) | stable |

Radars not checked: <none, or the source and why>.
```

In **Options considered**, add a "Radar ring" row to the dimension table.

In **Revisit triggers**, add radar triggers: "the org radar moves <tech> to
Hold", "the trial review date passes", "Thoughtworks moves <tech> out".

## 5. Close the loop with the radar (revolt)

An adoption ADR is evidence for the radar. When the ADR is accepted, offer
`/software-architecture:radar` to propose the matching ring change (for
example Assess to Trial), linking the ADR. Do not edit the radar without the
user's approval.
