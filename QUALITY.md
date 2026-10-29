---
title: software-architecture
description: >
  A public Claude Code plugin that embeds architecture practice in the work:
  skills, commands and agents for ADRs, fitness functions, the technology
  radar, governance levels and trade-off analysis, plus shell hooks that put
  governing context in front of an agent or developer at the moment of change.
ratingScale:
  - level: outstanding
    title: 🟢 Outstanding
    description: "The stretch band — reached only with significant extra effort."
    criterion: "Exceeds the requirement; satisfies it with margin to spare."
  - level: target
    title: 🔵 Target
    description: "The level to aim for — achievable at reasonable cost and effort."
    criterion: "Satisfies the requirement."
  - level: minimum
    title: 🟡 Minimum
    description: "The acceptable floor — less than you'd aim for, but consciously agreed as good enough to rely on."
    criterion: "Falls short of the target but remains acceptable."
  - level: unacceptable
    title: 🔴 Unacceptable
    description: "Below the floor — not good enough to rely on."
    criterion: "Does not meet the requirement to an acceptable degree."

# Model-wide factors. They recur across every constituent area below. Narrower
# factors live on the child areas.
factors:
  # Projection boundary: agent-harnessability is the model-wide FACTOR that
  # rates how well the repo equips an agent that changes this plugin. The
  # `agent-harness` AREA rates the steering files themselves. The plugin's
  # shipped skills and hooks are product, not harness.
  agent-harnessability:
    title: Agent Harnessability
    description: >
      The degree to which the repo's checked-in materials, tools, workflows,
      feedback signals, standards and action limits equip an AI agent to
      understand the plugin, take scoped work, operate the repo, preserve and
      resume state, verify its output, and stay safely bounded while the
      operator keeps direction, review and accountability. Distinct from the
      Agent harness area, which rates the steering files' own quality.
    factors:
      agent-accessibility:
        title: Agent accessibility
        description: >
          The degree to which decision-relevant knowledge is reachable by an
          agent at the moment of work, through a minimal entry point that
          discloses deeper material only when relevant.
        requirements:
          entry-point-routes-to-anchors:
            title: AGENTS.md routes an agent to STRATEGY.md, QUALITY.md, CONCEPTS.md, the ADRs and the test command
            assessment: >
              Open AGENTS.md (and CLAUDE.md, which should import it). Check that
              it is short and points to STRATEGY.md, QUALITY.md, CONCEPTS.md,
              docs/adr/, CONTRIBUTING.md and `npm test` without inlining their
              content.
      task-specifiability:
        title: Task specifiability
        description: >
          The degree to which a change can be handed to an agent as a scoped
          assignment with goals, non-goals and done criteria.
        requirements:
          changes-start-from-tracked-unit:
            title: Changes start from a tracked issue, ADR or plan with done criteria
            assessment: >
              Sample the 10 most recent merged PRs, excluding dependency bumps.
              Count those that link an issue, ADR or docs/plans/ file that
              states the goal and done criteria.
            ratings:
              outstanding: "10 of 10."
              target: "At least 8 of 10."
              minimum: "At least 6 of 10."
              unacceptable: "Fewer than 6 of 10."
      agent-operability:
        title: Agent operability
        description: >
          The degree to which a fresh agent session reaches a ready-to-work
          state from recorded materials without human-led setup.
        requirements:
          clean-clone-runs-tests:
            title: A clean clone runs the full test suite with Node alone
            assessment: >
              Clone the repo into an empty directory and run `npm test`. Check
              that it needs no install step, no network and no credential.
      continuity:
        title: Continuity
        description: >
          The degree to which an agent can resume work across compaction,
          interruption and handoff without chat history.
        requirements:
          in-flight-work-is-recorded:
            title: In-flight work leaves a durable record of decisions, remaining work and verification status
            assessment: >
              Inspect open PRs and the newest docs/plans/ files. Check that
              each records decisions made, remaining work and how it was
              verified, in the repo or the PR body.
      self-verifiability:
        title: Self-verifiability
        description: >
          The degree to which an agent can run deterministic checks on demand
          to confirm its own change, with output that points to the fix.
        requirements:
          one-command-verifies-change:
            title: One documented command verifies a change and names each failure
            assessment: >
              Run `npm test`. Check that it returns a pass/fail exit code and
              names the failing file and check for each failure.
      enforcement-of-standards:
        title: Enforcement of standards
        description: >
          The degree to which the repo's stated standards hold regardless of
          agent behavior, because gates block non-compliant output.
        requirements:
          standards-held-by-gates:
            title: Each STRATEGY.md Boundary and each CONTRIBUTING.md "must" is held by a test or CI gate
            assessment: >
              List the Boundaries in STRATEGY.md and the "must" rules in
              CONTRIBUTING.md. For each, find the test or CI job that enforces
              it. Count those held only by prose.
            ratings:
              outstanding: "Every one is held by a gate."
              target: "All but two are held by a gate, and each gap has an open issue."
              minimum: "At least half are held by a gate, and every gap has an open issue."
              unacceptable: "Fewer than half are held by a gate, or a gap has no issue."
      containment-of-action:
        title: Containment of action
        description: >
          The degree to which an agent is confined by enforced limits: a
          protected main branch, required checks before auto-merge, and
          least-privilege workflow permissions.
        requirements:
          main-requires-green-checks:
            title: No change reaches main without the required test check passing
            assessment: >
              Inspect the branch protection or ruleset for main and
              .github/workflows/auto-merge.yml. Check that auto-merge waits for
              the required checks and that no agent can bypass them.

  security:
    title: Security
    description: >
      The degree to which the plugin protects the sessions it runs in; it
      matters because its hooks execute shell code in every consumer session.
    requirements:
      # Veto: one hook that executes untrusted input rates the whole model
      # Unacceptable.
      hooks-never-execute-input:
        title: No hook evaluates, sources or executes text from its stdin, the prompt, tool input or repository files
        assessment: >
          Read every script in hooks/. Trace each use of hook input and of
          file content. Check that it is only matched or printed, never passed
          to eval, source, a subshell or an unquoted expansion. Run shellcheck
          where available.
        ratings:
          outstanding: "No finding, and a test feeds hostile input to each hook."
          target: "No finding."
          minimum: "No exploitable finding; style findings each have an open issue."
          unacceptable: "Any path where input reaches execution."
      hooks-stay-local:
        title: Hooks make no network call and read no credential or secret
        assessment: >
          Search hooks/ for network tools (curl, wget, nc, gh, git fetch/push)
          and for reads of credential files or token variables.
        ratings:
          outstanding: "No finding, and a test fails on any new network tool in hooks/."
          target: "No finding."
          minimum: "Not applicable: any finding is Unacceptable."
          unacceptable: "Any network call or credential read."
      workflows-least-privilege:
        title: Each GitHub workflow declares the narrowest permissions it needs
        assessment: >
          Read each file in .github/workflows/. Check for an explicit
          `permissions:` block and that write scopes appear only where the job
          needs them.

  privacy:
    title: Privacy
    description: >
      The degree to which tracked files, commits and PRs contain no personal
      data, client information or confidential business information; it
      matters because the repository is public.
    requirements:
      # Veto: PII or client information in a tracked file rates the whole model
      # Unacceptable.
      no-pii-in-tracked-files:
        title: No tracked file, commit message or PR names a person, client or confidential detail
        assessment: >
          Search tracked files and the last 50 commit messages for personal
          names, email addresses, client names, internal hostnames and
          confidential detail. People appear only as roles.
        ratings:
          outstanding: "No finding, and a check blocks new findings on every change."
          target: "No finding."
          minimum: "Findings exist only in history, each tracked by an open issue."
          unacceptable: "Any finding in a current tracked file."

  portability:
    title: Portability
    description: >
      The degree to which the plugin works in any adopting organization that
      configures its own standards; it matters because "bring your own
      standards" is a STRATEGY.md Boundary.
    requirements:
      no-hard-coded-org:
        title: Code and prompt assets name no organization, repository or system of the maintainers
        assessment: >
          Search skills/, commands/, agents/ and hooks/ for organization names,
          repository names and internal system names. Examples in docs must
          be clearly marked as examples.
        ratings:
          outstanding: "No finding, and a test fails on a new one."
          target: "No finding."
          minimum: "Findings only in clearly marked examples."
          unacceptable: "Any hard-coded name that changes behavior."
      standards-come-from-config:
        title: Every location of standards is read from ARCHITECTURE.md or an environment variable
        assessment: >
          Trace how skills, agents and hooks find ADRs and the radar. Check
          that each path comes from ARCHITECTURE.md, SA_RADAR_PATH or a
          documented default inside the consumer repo.

  traceability:
    title: Traceability
    description: >
      The degree to which each structural choice traces to the decision and
      reason behind it; it matters because the plugin preaches ADRs and must
      practice them.
    requirements:
      structural-changes-have-adrs:
        title: Each structural change to the plugin links an ADR in docs/adr/
        assessment: >
          Sample merged PRs that add or remove a skill, command, agent or hook,
          or change distribution. Count those that link or add an ADR.
        ratings:
          outstanding: "All of them."
          target: "All but one."
          minimum: "At least 3 of 4."
          unacceptable: "Fewer than 3 of 4."

  consistency:
    title: Consistency
    description: >
      The degree to which skills, commands, agents and docs use one
      vocabulary and one naming scheme; it matters because a term that drifts
      gives the agent two meanings.
    requirements:
      terms-match-concepts:
        title: Prompt assets use CONCEPTS.md terms and full `software-architecture:` names
        assessment: >
          Search skills/, commands/ and agents/ for cross-references without
          the `software-architecture:` prefix, and for synonyms of terms that
          CONCEPTS.md defines.

  currentness:
    title: Currentness
    description: >
      The degree to which docs reflect the code; it matters because README is
      what a consumer reads before installing.
    requirements:
      readme-counts-match:
        title: README counts and lists of skills, commands, agents and hooks match the repo
        assessment: >
          Count the entries in skills/, commands/, agents/ and hooks/ and
          compare them with README.

areas:
  skills-and-commands:
    title: Skills and commands
    description: >
      The architecture-practice skills and the `/software-architecture:`
      commands: the product's main content.
    source: "{skills/**,commands/**}"
    factors:
      activation-accuracy:
        title: Activation accuracy
        description: >
          The degree to which each skill's `description` triggers when its
          practice applies and only then; it matters because the description
          is the activation contract.
        requirements:
          descriptions-name-triggers:
            title: Each skill description states what it does, when to use it, and its trigger phrases
            assessment: >
              Read every skills/*/SKILL.md frontmatter. Check each description
              for the three parts and for overlap with a sibling skill.
          description-changes-are-tested:
            title: A change to a description is checked against real phrasings before merge
            assessment: >
              Inspect PRs that changed a `description`. Check that the PR
              records the phrasings tried and the result.
            ratings:
              outstanding: "Every such PR, with an automated trigger check."
              target: "Every such PR records phrasings tried."
              minimum: "Most such PRs."
              unacceptable: "Descriptions change without any trigger check."
      correctness:
        title: Correctness
        description: >
          The degree to which guidance is faithful to the cited architecture
          methods; it matters because wrong guidance is adopted with
          confidence.
        requirements:
          claims-cite-sources:
            title: Method claims cite their source
            assessment: >
              Sample 3 skills. Check that method claims cite a book, chapter or
              ADR, and that a spot check of 3 claims matches the source.
      understandability:
        title: Understandability
        description: >
          The degree to which a skill can be followed by an agent and a person
          without outside help.
        requirements:
          skills-are-progressive:
            title: Each SKILL.md keeps detail in references/ and stays within the size CONTRIBUTING.md sets
            assessment: >
              Measure each SKILL.md and check that long material is in
              references/.

  agents:
    title: Agents
    description: >
      The subagents adr-historian, architecture-reviewer and fitness-author.
    source: "agents/**"
    factors:
      correctness:
        title: Correctness
        description: >
          The degree to which agent reports cite real ADRs, fitness functions
          and radar entries; it matters because their output feeds decisions.
        requirements:
          reports-cite-real-paths:
            title: Agent reports cite only paths and entries that exist
            assessment: >
              Run each agent once against a fixture repo. Check every cited
              path and entry.
      containment:
        title: Containment
        description: >
          The degree to which read-only agents stay read-only.
        requirements:
          tools-match-role:
            title: Read-only agents declare no write tool
            assessment: >
              Read each agent's `tools` frontmatter. adr-historian and
              architecture-reviewer must not list Write or Edit; fitness-author
              writes only in an isolated worktree.
      efficiency:
        title: Efficiency
        description: >
          The degree to which each agent's model tier fits its task.
        requirements:
          model-tier-declared:
            title: Each agent declares a model tier with a reason
            assessment: >
              Read each agent's frontmatter and body for a model choice and
              its reason.

  hooks:
    title: Hooks
    description: >
      The shell hooks that run in consumer sessions. The planned
      governing-document gate and reminder will land here.
    source: "hooks/**"
    factors:
      reliability:
        title: Reliability
        description: >
          The degree to which a hook never breaks the session it runs in.
        requirements:
          silent-exit-on-no-match:
            title: Every hook exits 0 silently on no match, malformed input and a missing dependency
            assessment: >
              Run each hook with empty input, malformed JSON and a PATH that
              lacks its optional tools. Check the exit code and output.
            ratings:
              outstanding: "All cases pass, each covered by a test."
              target: "All cases pass, and the common ones are tested."
              minimum: "All cases pass by inspection; tests cover some."
              unacceptable: "Any case breaks the session or prints noise."
      relevance:
        title: Relevance
        description: >
          The degree to which hook output is signal, not noise.
        requirements:
          output-only-when-actionable:
            title: A hook prints only when it has a specific, actionable finding
            assessment: >
              Read each hook's output paths. Check that each message names a
              file, decision or rule and a next step.
      performance-efficiency:
        title: Performance efficiency
        description: >
          The degree to which hooks add little latency to each event.
        requirements:
          fast-per-event:
            title: Each hook finishes quickly on a typical repo
            assessment: >
              Time each hook on the test fixtures.
            ratings:
              outstanding: "Under 100 ms each."
              target: "Under 300 ms each."
              minimum: "Under 1 s each."
              unacceptable: "1 s or more for any hook."
      controllability:
        title: Controllability
        description: >
          The degree to which a consumer can turn each hook off, and a new
          blocking behavior is preceded by a warn period.
        requirements:
          each-hook-has-opt-out:
            title: Each hook has an SA_PLUGIN_HOOKS key and a row in README's opt-out table
            assessment: >
              Compare hooks/ and hooks.json with README's opt-out table and
              each script's opt-out check.
          warn-before-block:
            title: No hook blocks unless it first ran in warn mode and the change cites that evidence
            assessment: >
              Inspect each hook that can block, and the PR that made it block.

  distribution-and-release:
    title: Distribution and release
    description: >
      The plugin manifest, versioning and release through the public
      marketplace.
    source: "{.claude-plugin/**,package.json,CHANGELOG.md,.github/workflows/promote-stable.yml}"
    factors:
      installability:
        title: Installability
        description: >
          The degree to which a consumer installs the plugin from the
          marketplace without help.
        requirements:
          install-path-documented-and-valid:
            title: README's install steps work, and the manifests are valid
            assessment: >
              Run the manifest tests. Follow README's install steps in a clean
              session where possible.
      compatibility:
        title: Compatibility
        description: >
          The degree to which the plugin works with the Claude Code plugin
          format and the compound-engineering versions it extends.
        requirements:
          supported-versions-stated:
            title: The supported Claude Code and compound-engineering versions are stated and tested
            assessment: >
              Look for a stated support range and a test or CI job that checks
              it, including the Compound Pack shape once the pack exists.
      release-integrity:
        title: Release integrity
        description: >
          The degree to which main stays releasable and consumers get pinned
          tags (ADR-0004).
        requirements:
          main-releasable-and-tagged:
            title: Main passes CI at every commit, and each release is a tag the marketplace pins
            assessment: >
              Check CI status on recent main commits, and compare the latest
              tag with the marketplace entry and plugin.json version.

  governing-documents:
    title: Governing documents
    description: >
      STRATEGY.md, the ADRs, CONCEPTS.md, README, CONTRIBUTING.md and the
      ARCHITECTURE.md template: the context this plugin tells others to read.
    source: "{STRATEGY.md,CONCEPTS.md,README.md,CONTRIBUTING.md,docs/adr/**,docs/solutions/**}"
    factors:
      completeness:
        title: Completeness
        description: >
          The degree to which the plugin has the governing documents it asks
          its consumers to have.
        requirements:
          anchors-present:
            title: STRATEGY.md, QUALITY.md and docs/adr/ exist and AGENTS.md points to them
            assessment: >
              Check that each file exists and is linked from AGENTS.md.
      currentness:
        title: Currentness
        description: >
          The degree to which the documents match current decisions.
        requirements:
          superseded-adrs-marked:
            title: Superseded ADRs are marked and link their successor
            assessment: >
              Read each ADR's status. Check that a replaced decision says so.

  tests-and-ci:
    title: Tests and CI
    description: >
      The node:test suite and the GitHub workflows that gate auto-merge.
    source: "{test/**,.github/**}"
    factors:
      coverage:
        title: Coverage
        description: >
          The degree to which tests cover each shipped surface; it matters
          because CI is the only reviewer of an auto-merged change.
        requirements:
          every-surface-tested:
            title: Tests cover frontmatter of every skill, command and agent, every hook, and every manifest
            assessment: >
              Compare test/ with the repo layout. List any surface without a
              test.
      determinism:
        title: Determinism
        description: >
          The degree to which the suite gives the same result on every run.
        requirements:
          no-network-no-clock:
            title: Tests use no network and no wall-clock dependence
            assessment: >
              Read test/ for network calls and time-dependent assertions. Run
              the suite twice and compare.

  agent-harness:
    title: Agent harness
    description: >
      The repo's own steering files: AGENTS.md, CLAUDE.md, the CI workflows and
      the auto-merge configuration.
    source: "{AGENTS.md,CLAUDE.md,.github/workflows/**}"
    factors:
      coherence:
        title: Coherence
        description: >
          The degree to which the steering files agree with each other and with
          CONTRIBUTING.md.
        requirements:
          no-conflicting-instructions:
            title: AGENTS.md, CLAUDE.md and CONTRIBUTING.md give no conflicting instruction
            assessment: >
              Read the three files and list any conflict on branches, commits,
              tests or merging.
      currentness:
        title: Currentness
        description: >
          The degree to which the steering files match the repo as it is.
        requirements:
          repo-map-matches:
            title: The AGENTS.md repo map matches the directory layout
            assessment: >
              Compare the repo map with the top-level directories.

  quality-model:
    title: This QUALITY.md
    description: >
      The quality model itself.
    source: ./QUALITY.md
    factors:
      completeness:
        title: Completeness
        description: >
          The degree to which the model covers the needs and risks it names.
        requirements:
          risks-have-requirements:
            title: Each named risk maps to at least one requirement
            assessment: >
              Map each Risks entry to requirements. List any risk without one.
      assessability:
        title: Assessability
        description: >
          The degree to which each requirement can be assessed from evidence an
          agent can reach.
        requirements:
          lint-clean:
            title: "`qualitymd lint QUALITY.md` passes"
            assessment: >
              Run `qualitymd lint QUALITY.md`.
      traceability:
        title: Traceability
        description: >
          The degree to which each factor traces to a need, risk or decision.
        requirements:
          factors-trace-to-body:
            title: Each factor traces to a need, risk or STRATEGY.md line in the body
            assessment: >
              For each factor, find the body sentence or source it serves.
---

## Overview

software-architecture's quality matters because its hooks run in other people's
sessions and its guidance is adopted with confidence. One bad change reaches
every consumer that installed the plugin from the public marketplace.

The plugin embeds architecture practice in the work: ADRs, fitness functions,
the technology radar, governance levels and trade-off analysis, delivered as
skills, commands, agents and hooks. See STRATEGY.md for purpose, users and
boundaries.

The governing sense of "good" is **fitness for purpose**: the right
architectural context shows up at the moment of change, and nothing else does.
**Conformance** to the STRATEGY.md Boundaries and the ADRs is the main evidence
for it. Where the two disagree, fitness wins and the gap becomes a finding.

_Unknowns_ — none known.
_Open questions_ — none.

_Unreviewed (no human review yet); agent-reviewed — Claude Code, 2026-10-29._

## Scope

The model's boundary sets what an evaluation may judge: the whole repo, as a
composite of constituents.

In scope: Skills and commands, Agents, Hooks, Distribution and release,
Governing documents, Tests and CI, the Agent harness, and this file.
Model-wide factors (Agent Harnessability, security, privacy, portability,
traceability, consistency, currentness) apply across all of them.

Out of scope by design: the content of each adopting organization's own radar
and ADRs. They enter through configuration (STRATEGY.md Boundaries), and each
organization judges them in its own model.

Lifecycle is **active production**, chosen by the operator although the
version is 0.1.0, because the plugin is already installed from a public
marketplace. Risk tolerance is **moderate**: poor quality has a real cost, but
consumers can opt out of each hook and pin an earlier tag.

_Unknowns_ — none known.
_Open questions_ — none.

_Unreviewed (no human review yet); agent-reviewed — Claude Code, 2026-10-29._

## Needs

These needs decide which requirements matter most.

- **Engineers and AI agent sessions in adopting repos (primary)** need prior
  decisions, quality attributes and boundaries in context before a change, and
  no noise or delay when there is nothing to say (STRATEGY.md Users, Key
  metrics).
- **Architecture owners (secondary)** need their own radar and ADRs applied in
  every repo without manual review, and without the plugin imposing someone
  else's standards.
- **The operator and Claude agents on `claude/` branches (maintainers)** need a
  short entry point, one command to verify a change, and gates that hold the
  rules, because changes auto-merge on green CI.
- **Public marketplace consumers** need a plugin that installs cleanly, is
  pinned to tags, and is safe to run in their sessions.
- **The compound-engineering upstream** needs this plugin to extend its steps
  through supported mechanisms (Compound Packs) and to remove workarounds when
  upstream closes the gap.

_Unknowns_ — no usage, consumer or hook-log data exists yet; the needs come
from STRATEGY.md and the maintainers' view.
_Open questions_ — none.

_Unreviewed (no human review yet); agent-reviewed — Claude Code, 2026-10-29._

## Risks

These failures would make the plugin untrustworthy, ordered by how far they
spread.

1. **A hook executes untrusted input** and runs attacker-controlled code in a
   consumer session. Highest stakes. This is a **veto**: one finding rates the
   whole model 🔴 Unacceptable.
2. **PII or confidential information in the public repo.** Also a **veto**.
3. **A noisy, slow or blocking hook** damages work in repos the maintainers
   never see, and consumers uninstall the plugin.
4. **A wrong activation contract**: a skill description that triggers at the
   wrong time gives wrong guidance, or none.
5. **A release breaks consumers**: an unpinned or untested change reaches the
   marketplace.
6. **Hard-coded organization names** make the plugin wrong for every other
   adopter.
7. **Docs drift from the code**, so consumers and agents act on a stale map.

_Unknowns_ — none known.
_Open questions_ — none.

_Unreviewed (no human review yet); agent-reviewed — Claude Code, 2026-10-29._

## Unknowns

- Usage, consumer and hook-cost data do not exist yet. STRATEGY.md Key metrics
  depend on them, and the hook-log work in the Governing-document anchors track
  will supply part of it.
- Hook latency has not been measured on real consumer repos.

_Unreviewed (no human review yet); agent-reviewed — Claude Code, 2026-10-29._
