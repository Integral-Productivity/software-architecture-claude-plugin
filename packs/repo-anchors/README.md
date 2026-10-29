# repo-anchors

A Compound Pack (compound-engineering 3.33.1 or later) that makes planning and
review steps honor a repository's governing documents: the Boundaries and Key
metrics in `STRATEGY.md`, and the factors and requirements in `QUALITY.md`
(qualitymd format).

The rules carry no content of their own. Each one tells the agent which section
of which file in the repository under work to read, and how to cite it, so the
same pack serves every repository that has these documents.

Declare it in `.compound-engineering/config.yaml`, pinned to a release tag:

```yaml
packs:
  - source: https://github.com/<owner>/software-architecture-claude-plugin
    ref: <release tag>
    path: packs
    pack: repo-anchors
```

Packs reach `ce-plan`, `ce-brainstorm`, the full `ce-code-review` path and
`ce-doc-review`. For `ce-work`, `ce-debug` and `lfg`, the plugin's
`anchors-reminder.sh` hook adds the same sections at skill start (ADR-0005).
