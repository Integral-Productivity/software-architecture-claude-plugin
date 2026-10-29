---
title: Keep the requirements in the repository's QUALITY.md quality model
applies_when:
  - planning or reviewing a change in a repository that has a QUALITY.md at its root
  - adding behavior that touches security, privacy, reliability, traceability or another quality factor
  - adding personal, client or organization data to a tracked file
tags: [quality, qualitymd, requirements, governing-documents]
---

Read `QUALITY.md` at the repository root. It is a quality model in the
qualitymd format: it names quality factors, and each factor has requirements a
change must keep. A requirement marked as a veto blocks a change on its own.

- In a plan, name each factor the change touches and the requirement it must
  keep, and say how the plan keeps it (a test, a check, or a design choice).
- In a review, flag a change that breaks a requirement as a finding. Name the
  factor and quote the requirement. Treat a broken veto requirement as the most
  severe finding in the review.
