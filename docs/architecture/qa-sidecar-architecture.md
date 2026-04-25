# MZTEK QA Sidecar Architecture

## Purpose

Define how a side-by-side QA agent should operate while MZTEK is building or
auditing work so the same worker is not the only voice deciding whether
progress is trustworthy.

## Core Rule

Builder output should not be treated as final truth without an independent QA
view when risk, ambiguity, or repeated drift is present.

## Responsibilities

- Review builder attempts in parallel
- Check whether claimed completion matches evidence
- Flag missing proof, scope drift, and partial-fix-as-full-fix behavior
- Record critique without overwriting the builder's own ledger
- Recommend tighter next-step strategy when behavior keeps drifting

## First Integration Points

### Prompt Ledger Link
- each builder prompt attempt should be able to link to one or more QA reviews
- QA should reference the same prompt ID rather than rewriting builder history

### Decision Trace Split
- dashboard should eventually show:
  - builder view
  - QA view
  - reconciled next strategy

### Strategy Adaptation Trigger
- when the same correction fails repeatedly, QA should help classify:
  - constraint drift
  - false completion
  - root-cause skipped
  - weak evidence
  - wrong tool or model path

## Storage Direction

The safer shape is a separate QA review ledger instead of mixing QA comments
directly into builder records.

Possible first file:
- `.mztek/reviews.json`

Each review should eventually capture:
- review ID
- linked prompt ID
- linked task ID
- severity
- failure class
- critique
- evidence gap
- recommended next action
- created at
- source type (`manual`, `qa-agent`, `imported`)

## Dashboard Requirement

The dashboard should not imply that all displayed reasoning is live runtime
thought.

For QA views especially, it should label whether a field is:
- recorded
- derived
- default

## Near-Term Goal

Start with truthful separation and visible QA critique before attempting rich
multi-agent orchestration.
