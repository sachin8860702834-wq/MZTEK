# MZTEK MVP Validation Scenarios

This document defines the first three realistic scenarios used to validate the MZTEK MVP.

The goal is to verify that MZTEK can:

- detect fake completion claims
- catch hidden or missing dependencies
- distinguish verified completion from polished but incomplete work

## Scenario Set

### 1. Fake Done

Intent:
A user or IDE claims that a feature is complete, but the evidence does not support the claim.

Expected MZTEK behavior:

- mark the task as `suspicious` or `blocked`
- identify missing proof
- downgrade completion status
- create follow-up validation tasks
- log the issue as a zero-trust failure pattern

Primary checks:

- claim vs evidence mismatch
- missing validation proof
- unresolved dependency indicators
- absent runtime or UX verification

### 2. Missing Dependency

Intent:
A feature implementation assumes a backend, schema, environment variable, route, or service exists when it does not.

Expected MZTEK behavior:

- detect the missing dependency before completion
- block downstream tasks that rely on it
- create a dependency task or blocker
- show ownership and next action clearly

Primary checks:

- undeclared dependency usage
- dependency graph mismatch
- frontend/backend mismatch
- env or config incompleteness

### 3. Verified Completion

Intent:
A feature is implemented with evidence, dependency closure, and validation proof.

Expected MZTEK behavior:

- mark the task as `validated`
- preserve evidence links
- update progress confidently
- avoid false negative blocking

Primary checks:

- explicit completion criteria
- validation evidence present
- dependencies resolved
- no unresolved blockers

## MVP Acceptance Criteria

The MVP testing layer is considered useful if MZTEK can do all of the following:

1. Reject at least one fake-done scenario with a clear reason.
2. Catch at least one missing dependency before the task is marked done.
3. Accept at least one genuinely verified task without unnecessary rejection.
4. Produce a structured state result:
   - `status`
   - `reason`
   - `missing_proof`
   - `missing_dependencies`
   - `next_actions`
5. Preserve enough fixture metadata to replay the scenario later.

## Suggested Test Loop

For each fixture:

1. Load fixture input.
2. Run the MZTEK evaluation path.
3. Compare actual result to the fixture's expected outcome.
4. Record mismatches.
5. Fix rule, prompt, or validation logic.
6. Re-run the same fixture.

This keeps the build loop aligned with the MZTEK principle:

`Plan broadly, build incrementally, validate continuously.`
