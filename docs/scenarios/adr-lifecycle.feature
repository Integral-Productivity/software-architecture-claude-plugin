# Behavior of the ADR scope, lifecycle and panarchical context (ADR-0006).
#
# Hook scenarios are covered by test/hooks.test.mjs ("adr-pretooluse.sh …"
# and "prompt-submit.sh adds the ADR scope …"). Skill and command scenarios
# run inside a session and are verified by a dogfood run, not npm test.

Feature: ADRs record architectural decisions and stay healthy across their lifecycle

  # Triggering (Hook 10)

  Scenario: Writing a new ADR file puts the practice in front of the agent
    Given a repository with a docs/adr directory
    When the agent writes a new file docs/adr/0007-use-postgres.md
    Then the agent is told to load software-architecture:architecture-decision-records
    And the context states the scope test and the non-ADR homes
    And the context asks for a "Placement fit:" line
    And the placement hook adds no second reminder

  Scenario: Running adr new triggers the same context
    When the agent runs "adr new Use event sourcing for orders"
    Then the context states the scope test

  Scenario: Editing an ADR gives the lifecycle rules
    Given docs/adr/0001-x.md exists
    When the agent edits it
    Then the context says not to rewrite an Accepted Decision
    And the context says a supersession is linked both ways

  # Scope

  Scenario: A worklog is not written as an ADR
    Given the agent has finished a task and drafts "what we did today" as an ADR
    When it applies the scope test
    Then it fails gate 1
    And the agent records the worklog in the PR body or session ledger instead
    And the agent says which gate failed in one line

  Scenario: An observed fact amends the decision it breaks, not a new ADR
    Given an Accepted ADR assumes a system is hosted by provider A
    And the agent observes it is hosted by provider B
    When the observation changes no decision
    Then the fact is recorded in a fact register
    And no ADR is created

  # Remember and revolt

  Scenario: Higher-level ADRs load in configured order
    Given ARCHITECTURE.md has a Context Sources table with Enterprise at order 1 and Platform at order 2
    When the agent writes a new ADR
    Then the context lists the Enterprise source before the Platform source
    And the agent cites each constraining ADR on a "Constrained by:" line

  Scenario: A local departure goes upward
    Given a binding Enterprise ADR that the new decision departs from
    When the agent writes the ADR
    Then the ADR records "Deviates from:" with the reason
    And the agent offers an upstream proposal through the Enterprise revolt channel
    And nothing is filed upstream without the user's approval

  Scenario: No Context Sources configured
    Given ARCHITECTURE.md has no Context Sources table
    When the agent writes a new ADR
    Then the context offers /software-architecture:context to configure them

  # Portfolio

  Scenario: The audit proposes and never edits
    When the user runs /software-architecture:adr-audit
    Then the report lists each finding with evidence and a proposed action
    And no ADR file is changed, deleted or renumbered

  # Technology adoption from radars (ADR-0007)

  Scenario: A technology-adoption ADR is drafted from the configured radars
    Given ARCHITECTURE.md has a Radar Sources table with the org radar at order 1 and Thoughtworks at order 2
    When the user runs /software-architecture:adopt for a technology and two alternatives
    Then every option is looked up on every radar
    And the ADR has a Radar evidence section and a radar row in its options table
    And a radar that could not be reached is listed as "not checked"

  Scenario: The org ring shapes the ADR
    Given the chosen technology is on Hold in the org radar
    When the ADR is drafted
    Then it records "Deviates from:" naming the Hold entry
    And it offers an upstream proposal through /software-architecture:radar

  Scenario: A new non-Adopt dependency suggests an adoption ADR
    Given SA_RADAR_PATH places a dependency on Trial
    When the agent adds it to package.json
    Then the context suggests /software-architecture:adopt with trial scope and exit criteria
