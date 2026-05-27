---
name: context
description: Interactive multi-level architecture governance interview. Maps the 5 governance levels (Enterprise/Platform/System/Service/Code) and C4 levels to the user's org, then writes ARCHITECTURE.md at the repo root.
---

# /software-architecture:context

Run the multi-level architecture governance interview. Produces an
`ARCHITECTURE.md` at the chosen root capturing the routing table for the
repo plus optional C4 stubs.

This is the **setup command** for the plugin — the `adr-historian` agent
depends on the routing table this command produces.

## Process

1. **Determine the org structure** — ask the user:
   - Solo dev? Team of one repo? Multi-team multi-repo? Multi-product
     org?
   - Where do you operate? (Match to the 5 levels.)

2. **For each level present, identify the home** — walk through:
   - Enterprise / Cross-Cutting: where do org-wide standards live?
     Default for Integral Productivity:
     `software-architecture-excellence/docs/adr/` (SAE-).
   - Platform / Cross-System: where does CI/DevOps live? Default:
     `devops-excellence/docs/adr/` (ADR-).
   - System / Solution: this product's `docs/adr/`.
   - Service / Component: inside the service dir.
   - Code: not ADR'd (mention but don't require a path).

3. **Detect gaps** — if a level is missing (e.g., no Platform repo yet,
   no `docs/adr/` in this repo), offer to bootstrap (`adr init docs/adr`).

4. **Identify cross-references** — does this repo's ADRs reference
   higher-level decisions? List the parent repos / paths.

5. **C4 stubs (optional)** — ask if the user wants Context, Container,
   Component stubs. Provide minimal templates with placeholder text.

6. **Write `ARCHITECTURE.md`** at the chosen root (usually repo root).
   Use the template from
   `software-architecture:architecture-governance-levels` SKILL.md.

7. **Commit** — propose a commit on a `claude/architecture-context`
   branch. Confirm before commit (shared-state action).

## When to Re-Run

- Org structure changes (new platform repo, new product).
- A new repo is created.
- A misrouted ADR is discovered.

## Arguments

Optional path argument — root to write `ARCHITECTURE.md` to. Defaults to
the current repo root.
