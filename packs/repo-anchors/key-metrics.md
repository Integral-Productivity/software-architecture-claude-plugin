---
title: Say which Key metric in the repository's STRATEGY.md a change moves or protects
applies_when:
  - planning a feature or a change that could move a metric listed in STRATEGY.md Key metrics
  - reviewing a change that alters behavior a Key metric measures
tags: [strategy, metrics, outcomes, governing-documents]
---

Read the `## Key metrics` section of `STRATEGY.md` at the repository root.

- In a plan, name each metric the change should move, the direction, and the
  data source the metric names. Name each metric the change must not degrade.
- In a review, flag a change that degrades a metric, or removes the data source
  a metric depends on, as a finding. Quote the metric.
- If no metric applies, say so in one line rather than inventing one.
