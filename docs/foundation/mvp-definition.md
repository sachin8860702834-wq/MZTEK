# MZTEK MVP Definition

## MVP Goal

Reach a usable MZTEK baseline that proves the product can:
- hold grounded project memory
- track work and ownership
- reject fake completion claims
- evaluate realistic sample-project scenarios
- seed governed sample projects from reusable assets

## What Counts As MVP

### Required
- Local CLI
- `.mztek` project state
- Project notebook core
- Task and decision tracking
- Zero-trust validation for project tasks
- Fixture evaluation for realistic AI/IDE output
- Reusable sample project loading
- At least one benchmark pack
- Regression tests covering core scenarios

### Nice To Have, But Not Required For MVP
- Dashboard UI
- IDE middleware
- agent orchestration
- local/cloud model routing
- advanced learning engine
- enterprise policy mode

## MVP Success Criteria

MZTEK MVP is considered usable when it can do all of the following:

1. Initialize a governed project locally.
2. Record tasks, decisions, and evidence.
3. Detect fake "done" claims in structured task state.
4. Evaluate realistic sample fixtures with correct downgrade behavior.
5. Seed a realistic sample project into a governed `.mztek` workspace.
6. Pass regression tests for suspicious, blocked, and validated outcomes.
7. Keep product code, sample projects, and reusable library assets clearly separated.

## Current State Against MVP

### Already Working
- CLI initialization
- project state persistence
- task creation
- evidence recording
- decision logging
- zero-trust task validation
- fixture evaluation
- Career Mantra sample seeding
- benchmark-pack storage
- regression test suite

### Still Needed To Feel Like A Strong MVP
- richer project status/reporting
- benchmark-aware validation during project checks
- stronger notebook summaries
- better seeded sample workflow for ongoing use
- cleanup and normalization of workspace structure

## Practical MVP Boundary

The MVP should be command-line first and evidence-driven.

It does not need polished UI to be useful if it can already:
- govern project state
- reject shallow completion
- track decisions and tasks
- validate realistic scenarios
