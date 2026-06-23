---
name: technology-radar
description: >
  Evaluate technologies against the Thoughtworks Technology Radar and your
  org's custom radar. Use when selecting a technology, comparing tools or frameworks,
  checking whether a library is recommended, reviewing a dependency, doing a
  technology audit, or proposing a ring change. Invoke alongside
  `superpowers:brainstorming` when a technology choice is on the table, and
  alongside `software-architecture:architecture-decision-records` when the
  ADR involves technology selection.
status: draft
version: 1.0.0
---

# Technology Radar

The Technology Radar evaluates technologies against known good practice and
organizational experience. This skill checks two radars:

1. **Thoughtworks Technology Radar** — the industry reference, updated twice
   yearly, covering thousands of technologies across four quadrants.
2. **Org Custom Radar** *(optional)* — your organization's own canonical
   radar, capturing adoption experience, organizational constraints, and
   toolchain preferences. Its location is configured per-repo in
   `ARCHITECTURE.md` (via `/software-architecture:context`). If your org
   doesn't maintain one, this skill works against the Thoughtworks radar alone.

A technology that scores well on both radars is a safe, well-understood
choice. A tension between radars (Thoughtworks says Adopt but your org says
Hold) is a signal worth examining. A technology absent from both is an
unknown that needs assessment before adoption.

> **Note:** A future ADR ("radar-as-database") will replace the markdown
> radar with a structured store, enabling the plugin's Hook 3 to query
> programmatically without parsing markdown. Tracked separately.

---

## Radar Model

### Quadrants

| Quadrant | What it covers |
|----------|---------------|
| **Languages & Frameworks** | Programming languages, web frameworks, testing libraries |
| **Tools** | Development tools, build systems, CI/CD tools, monitoring |
| **Platforms** | Infrastructure, cloud services, databases, deployment targets |
| **Techniques** | Architectural approaches, development practices, methodologies |

### Rings

| Ring | Meaning | Guidance |
|------|---------|---------|
| **Adopt** | Proven, mature, widely recommended | Low risk. Default choice unless strong reason not to. |
| **Trial** | Worth pursuing with care | Try on a non-critical project first. Gather experience before broad adoption. |
| **Assess** | Worth exploring | Investigate; understand trade-offs. Not ready for production adoption. |
| **Hold** | Proceed with caution | Known problems or being superseded. Don't start new projects here. |

A blip that has **moved** rings recently (Trial → Adopt, or Adopt → Hold)
is a signal: the community has gathered new evidence. Pay attention to
direction.

---

## Thoughtworks Technology Radar

Current radar: `https://www.thoughtworks.com/radar`.

### Looking Up a Technology

1. Use `WebSearch` or `WebFetch`:
   - Search: `"<technology name>" site:thoughtworks.com/radar`
   - A-Z list: `https://www.thoughtworks.com/radar/a-z`

2. Extract:
   - **Ring** (Adopt / Trial / Assess / Hold)
   - **Quadrant**
   - **Edition** (which radar version placed it here)
   - **Movement** (new blip, moved in, moved out)
   - **Rationale**

3. If not found: note "not assessed by Thoughtworks" — not the same as "Hold."

---

## Org Custom Radar

If your organization maintains its own radar, its location is recorded in
the repo's `ARCHITECTURE.md` (under a "Technology Radar" entry, written by
`/software-architecture:context`). A common pattern is a markdown file in a
shared standards repo, e.g. `<your-org>/architecture-standards/docs/tech-context/radar.md`.

### Accessing the Radar

1. Read the radar location from `ARCHITECTURE.md`.
2. Read the radar file from the configured local path, or `WebFetch` it from
   the configured URL if no local clone is present.

If no custom radar is configured, skip this section and evaluate against the
Thoughtworks radar alone. The plugin's Hook 3 (dep-file `PreToolUse`) reads
the configured radar at runtime and degrades gracefully when it's absent.

### Expected Format

The radar's markdown structure has four sections — Adopt, Trial, Assess,
Hold — each with a table:

| Technology | Category | Notes |
|---|---|---|
| TypeScript | Language | Default for all new projects |

### Proposing a Ring Change

Significant ring movements (Adopt ↔ Hold, or anything changing default
behavior across multiple repos) require an ADR at the enterprise /
cross-cutting level — see `software-architecture:architecture-governance-levels`
for where that lives in your org.

Use `/software-architecture:radar` to scaffold both the radar edit and the
companion ADR in one flow.

---

## Evaluation Workflow

### Step 1 — Look up Thoughtworks radar

```
WebSearch: "<technology>" site:thoughtworks.com/radar
```

Extract ring, quadrant, movement signal, rationale.

### Step 2 — Look up your org's custom radar

If one is configured (see `ARCHITECTURE.md`), read the radar file or fetch
it. Extract ring, category, notes. Skip this step if no custom radar exists.

### Step 3 — Present findings

```
Technology: <Name>
Quadrant: <quadrant>

Thoughtworks radar:
  Ring: <Adopt|Trial|Assess|Hold|Not on radar>
  Movement: <new|moved in|moved out|stable>
  Rationale: <one sentence from Thoughtworks>

Org radar:
  Ring: <Adopt|Trial|Assess|Hold|Not assessed|Not configured>
  Notes: <org experience summary>

Assessment:
  <consistent / tension / not-on-radar>

Recommendation:
  <one paragraph — what to do given the current decision context>
```

### Step 4 — Flag tensions

If the two radars disagree, surface the tension explicitly:

- **Org Hold overrides Thoughtworks Adopt** when there's a known
  organizational constraint (licensing, cost, skills gap, bad integration
  experience).
- **Thoughtworks Adopt overrides org silence** when your org has no
  experience yet and the technology is well-proven industry-wide.
- **Both Hold** = strong signal to avoid; document the reason in the ADR.

---

## Integration with Other Skills

### With `superpowers:brainstorming`

During the "Exploring approaches" phase, when options involve different
technologies, run a radar check on each option before recommending. Include
ring placements in the options comparison table.

### With `software-architecture:architecture-decision-records`

When an ADR involves technology selection, run the radar check before
writing the options section. Include radar findings as a dimension in the
options table. An option at "Hold" on both radars requires explicit
justification.

### With `software-architecture:architectural-fitness-functions`

If the radar reveals a technology is moving to Hold (community moving
away), encode a fitness check that detects deep coupling to that
technology's APIs — so you'll know how hard it would be to migrate.
