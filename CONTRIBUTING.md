# Contributing to the Software Architecture plugin

## Plugin scope

This plugin is for **cross-product, cross-engagement architecture
practice** — skills, agents, commands, and hooks that apply across
multiple products or teams.

**Product-specific** content does not belong here — it lives in the
product's own plugin. The dividing line: if a skill encodes the internals,
data model, or stack of one specific product, it's product-specific; if it
teaches a practice any product could apply, it belongs here.

## When to add a skill

Add a skill when:
- The activation phrase is distinct from existing skills' activation phrases
- The content is substantial enough to be a teaching artifact (not a
  one-line note)
- The content is cross-product (not specific to one product's internals)

Don't add a skill when:
- It overlaps significantly with an existing skill (extend the existing
  one instead)
- It would activate on phrases that already trigger another skill
- The knowledge belongs in `superpowers:` (that's not ours to extend)

## When to add a command

Add a command when:
- A workflow has > 3 steps that should be invoked together
- The workflow benefits from being explicitly user-invoked (not
  passively skill-activated)
- The workflow has a clear name in the `/software-architecture:<verb>` pattern

## When to add an agent

Add an agent when:
- Significant context isolation is needed (avoid polluting main thread)
- Heavy parallel work is involved (search, analysis)
- Worktree isolation is needed for safe writes

## When to add a hook

Hooks are the most invasive surface. Add a hook only when:
- A manual mental discipline can be replaced by an automatic check
- The signal-to-noise ratio is excellent (fires only when relevant)
- Users can opt out per-hook via `SA_PLUGIN_HOOKS`

## Authoring conventions

### Skill frontmatter

```yaml
---
name: <kebab-case>
description: >
  <When to use this skill, in 2–4 sentences. Include trigger phrases.
  Cross-reference sibling skills.>
status: draft | tested | stable | deprecated
version: <semver>
---
```

### Cross-references

Use the full namespace: `software-architecture:<skill-name>`. Don't
shorten to `<skill-name>` — that's ambiguous in available-skills
listings.

### Branch naming

- `claude/<slug>` for Claude-authored work (a convenient convention if your
  CI uses it to gate auto-merge).
- `adr/<slug>` for plugin-local ADR work.
- `feat/<slug>`, `fix/<slug>`, `chore/<slug>` for human-authored work.

### Conventional Commits

All commits use [Conventional Commits](https://www.conventionalcommits.org):
`feat(scope):`, `fix:`, `chore:`, `docs:`, `ci:`.

## Testing

Run the suite with `npm test`. It uses Node's built-in test runner
(`node:test` + `node:assert/strict`) — no third-party test framework, no
install step beyond Node 20+. The tests live in `test/`:

- **`frontmatter.test.mjs`** — every `skills/*/SKILL.md`, `commands/*.md`,
  and `agents/*.md` has parseable YAML frontmatter with the required
  non-empty fields: `name` + `description` for skills and commands; plus
  `tools` + `model` for agents.
- **`hooks.test.mjs`** — every `hooks/*.sh` is executable, parses cleanly
  under `bash -n`, and on a representative stdin payload exits 0 emitting
  only valid JSON (the JSON-emission checks need `jq`, the hooks' own
  runtime dependency, and skip when it is absent).
- **`manifest.test.mjs`** — `.claude-plugin/plugin.json` is valid JSON with
  non-empty `name`/`description`/`version`, and every hook command in
  `.claude-plugin/hooks.json` resolves to an executable script.

The shared frontmatter reader and file-discovery helpers live in
`test/lib/`.

## Architecture decisions about the plugin itself

The plugin eats its own dogfood. Decisions about this plugin's structure
land as ADRs in `docs/adr/` of this repo. See `docs/architecture.md` for
the routing.

## Distribution

The plugin is published from this repository. Consumers add it as a plugin
marketplace and install the `software-architecture` plugin (see the README).
Merges to `main` are the release surface — keep `main` releasable.
