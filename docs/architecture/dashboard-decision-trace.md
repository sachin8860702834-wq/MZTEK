# MZTEK Dashboard Decision Trace

## Purpose

MZTEK should show the basis for live project decisions while work is happening
so users and reviewers can understand what was observed, what was checked, and
why a decision was made.

This is not meant to be a teaching mode or a raw mental dump. It is a
structured reasoning artifact for trust, transparency, and review.

## Dashboard Requirement

The dashboard should expose a `Decision Trace` panel that shows:
- goal
- observed signals
- principles applied
- checks run
- assumptions rejected
- current decision
- missing proof
- next action

## Why It Matters

- Helps users trust the system while it works
- Makes decisions reviewable later
- Improves code review and project handoff clarity
- Shows what MZTEK is doing without relying on vague status text
- Makes robust engineering thinking visible in a practical form

## Product Rule

Expose structured decision intelligence, not raw hidden chain-of-thought.

## First Implementation

The first dashboard version can derive the trace from:
- live project status
- current focus
- project principles
- latest validation findings
- recent decisions
- next planned action

Later versions can add:
- task-level traces
- prompt-to-decision links
- audit-mode decision history
- per-agent decision records

## Live Behavior

The dashboard should behave like a live project surface, not a static report.

The first usable version includes:
- automatic browser refresh
- a sensible default project target
- a JSON endpoint for future richer UI updates
