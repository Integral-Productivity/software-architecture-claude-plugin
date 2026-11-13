# Lifecycle-bound ADR fitness function (ADR-0009, issues #84 and #85).
#
# Each scenario is covered by a test in test/adr-fitness.test.mjs that names it.

Feature: The severity of an ADR's findings follows its lifecycle state

  Background:
    Given the curing period is 30 days
    And an ADR has no "Provenance:" line

  Scenario: A Proposed ADR reports its findings as info
    Given the ADR status is "Proposed 2026-11-01"
    When the fitness function runs on 2026-12-31
    Then the finding is reported as info
    And the run passes

  Scenario: A newly Accepted ADR warns during the curing period
    Given the ADR status is "Accepted 2026-11-20"
    When the fitness function runs on 2026-12-01
    Then the finding is reported as warn
    And the warning says how many days remain before it fails
    And the run passes

  Scenario: An Accepted ADR fails once the curing period has elapsed
    Given the ADR status is "Accepted 2026-10-01"
    When the fitness function runs on 2026-11-13
    Then the finding is reported as fail
    And the run fails

  Scenario: Existing ADRs are not failed on the day the rule is adopted
    Given the ADR status is "Accepted 2026-05-27"
    And the rule was adopted in the repository on 2026-11-13
    When the fitness function runs on 2026-11-20
    Then the finding is reported as warn

  Scenario: A finished ADR stays at info
    Given the ADR status is "Superseded 2026-11-01 by ADR-0009"
    When the fitness function runs on 2026-12-31
    Then the finding is reported as info

  Scenario: A complete Accepted ADR has no findings
    Given the ADR has a provenance line naming a GitHub issue
    And it has Context, Decision, Consequences and Revisit triggers sections
    And its status is "Accepted 2026-10-01"
    When the fitness function runs on 2026-11-13
    Then there are no findings
    And the run passes

  Scenario: Provenance must name a tracked work item by ID
    Given the ADR provenance line names only "a chat thread"
    When the fitness function runs
    Then it reports that provenance names no GitHub issue, Productboard entity or GlassFrog project

  Scenario: A Superseded ADR must link to a successor that links back
    Given the ADR status is "Superseded 2026-11-01 by ADR-0009"
    And ADR-0009 does not link back to it
    When the fitness function runs
    Then it reports the missing back-link at the successor's severity
