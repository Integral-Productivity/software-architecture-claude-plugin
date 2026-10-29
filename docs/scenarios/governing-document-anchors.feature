# Behavior of the governing-document anchors (ADR-0005).
#
# "Anchors" are STRATEGY.md, QUALITY.md and, when the repository has one,
# ARCHITECTURE.md at the repository root. Layers 2 and 3 are covered by
# test/anchors.test.mjs; each test names the scenario it covers. Layer 1 runs
# inside compound-engineering and is verified by a dogfood run, not npm test.

Feature: Governing documents are read before an agent changes a repository

  Background:
    Given SA_ANCHORS_OWNERS lists the owner of the repository's origin remote

  # Layer 1: the repo-anchors Compound Pack (verified by dogfood)

  Scenario: A plan cites the Boundary it respects
    Given the repo-anchors pack is declared in .compound-engineering/config.yaml
    When ce-plan plans a change that adds a new script to the repository
    Then the plan cites "(pack: repo-anchors, strategy-boundaries.md)"
    And the plan names the STRATEGY.md Boundary that governs where the script goes

  Scenario: Full review flags a change that breaks a Boundary
    Given the repo-anchors pack is declared in .compound-engineering/config.yaml
    And a local diff that adds executable logic the Boundaries forbid
    When ce-code-review reviews it on the full path
    Then a finding cites "(pack: repo-anchors, strategy-boundaries.md)"
    And the finding quotes the Boundary from STRATEGY.md

  Scenario: Full review flags a change that breaks a QUALITY.md requirement
    Given the repo-anchors pack is declared in .compound-engineering/config.yaml
    And a local diff that adds a personal name to a tracked file
    When ce-code-review reviews it on the full path
    Then a finding cites "(pack: repo-anchors, quality-requirements.md)"
    And the finding names the QUALITY.md factor and requirement

  Scenario: A plan names the Key metric a change moves
    Given the repo-anchors pack is declared in .compound-engineering/config.yaml
    When ce-plan plans a change that could move a metric in STRATEGY.md Key metrics
    Then the plan names the metric and whether the change should move or protect it

  # Layer 2: the skill-start reminder (warn mode)

  Scenario Outline: The reminder fires before a step that packs do not reach
    Given a git repository with STRATEGY.md and QUALITY.md at its root
    When the session invokes the skill "<skill>"
    Then the hook adds context that names the Boundaries, Key metrics and QUALITY.md requirements
    And the hook does not deny the call
    And the hook writes one reminder line to the gate log

    Examples:
      | skill                                 |
      | compound-engineering:ce-work          |
      | compound-engineering:ce-debug         |
      | compound-engineering:ce-code-review   |
      | compound-engineering:lfg              |

  Scenario: The reminder fires for a typed slash command
    Given a git repository with STRATEGY.md and QUALITY.md at its root
    When the user types "/compound-engineering:ce-debug fix the parser"
    Then the hook adds context that names the Boundaries, Key metrics and QUALITY.md requirements

  Scenario: The reminder ignores a prompt that only mentions a skill
    Given a git repository with STRATEGY.md and QUALITY.md at its root
    When the user types "please run ce-work after lunch"
    Then the hook adds no context

  Scenario: The reminder stays silent for other skills
    Given a git repository with STRATEGY.md and QUALITY.md at its root
    When the session invokes the skill "compound-engineering:ce-ideate"
    Then the hook adds no context

  Scenario: The reminder says a missing anchor is missing
    Given the repository has STRATEGY.md but no QUALITY.md
    When the session invokes the skill "compound-engineering:ce-work"
    Then the hook context says that QUALITY.md is missing
    And it names the skill that creates it

  Scenario: An opted-out repository gets no reminder
    Given the repository has a .anchors-opt-out file at its root
    When the session invokes the skill "compound-engineering:ce-work"
    Then the hook adds no context

  Scenario: A session outside a git repository gets no reminder
    Given the working directory is not inside a git repository
    When the session invokes the skill "compound-engineering:ce-work"
    Then the hook adds no context

  # Layer 3: read tracking and the change gate (warn mode)

  Scenario: An unread repository gets a warning before its first change
    Given a git repository with STRATEGY.md and QUALITY.md at its root
    And the session has read neither file
    When the agent edits a file in the repository
    Then the hook context names STRATEGY.md and QUALITY.md as unread
    And the hook does not deny the call
    And the hook writes one warn line to the gate log

  Scenario: The gate is silent when no owner list is configured
    Given SA_ANCHORS_OWNERS is unset
    When the agent edits a file in the repository
    Then the hook adds no context

  Scenario: A repository whose anchors were read passes silently
    Given the session read STRATEGY.md and QUALITY.md at the repository root
    When the agent edits a file in the repository
    Then the hook adds no context
    And the hook writes one pass line to the gate log

  Scenario: A plain shell read counts as a read
    Given the session ran "cat STRATEGY.md" and "head QUALITY.md" at the repository root
    When the agent edits a file in the repository
    Then the hook adds no context

  Scenario: A read of a file with the same name elsewhere does not count
    Given the session read docs/STRATEGY.md only
    When the agent edits a file in the repository
    Then the hook context names STRATEGY.md as unread

  Scenario: The gate warns once per repository per session
    Given the gate warned about this repository in this session
    When the agent edits another file in the repository
    Then the hook adds no context

  Scenario: A missing anchor is named with the skill that creates it
    Given the repository has STRATEGY.md but no QUALITY.md
    When the agent writes a file in the repository
    Then the hook context says that QUALITY.md is missing
    And it names the qualitymd quality skill

  Scenario: ARCHITECTURE.md counts only when it exists
    Given the repository has an unread ARCHITECTURE.md
    When the agent edits a file in the repository
    Then the hook context names ARCHITECTURE.md as unread

  Scenario: A shell command that writes files counts as a change
    Given the session has read neither anchor
    When the agent runs "git commit -m x" in the repository
    Then the hook context names the unread anchors
    When the agent runs "ls -la" in the repository
    Then the hook adds no context

  Scenario: A worktree shares the reads of its main checkout
    Given the session read both anchors in the main checkout
    When the agent edits a file in a worktree of the same repository
    Then the hook adds no context

  Scenario: Reads do not cross sessions
    Given another session read both anchors
    When the agent edits a file in the repository
    Then the hook context names the unread anchors

  Scenario: An opted-out repository gets no warning
    Given the repository has a .anchors-opt-out file at its root
    When the agent edits a file in the repository
    Then the hook adds no context

  Scenario: A file outside any git repository gets no warning
    When the agent edits a file that is not inside a git repository
    Then the hook adds no context
