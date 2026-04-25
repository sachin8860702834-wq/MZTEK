# Council Learning Log - April 25, 2026

## Purpose
Capture how delegated workers performed during the dashboard redesign and convert observations into MZTEK anti-false-positive rules.

## Session Scope
- Objective: make dashboard real-data driven and more usable.
- Delegation model:
  - Worker 1: UI shell and visual hierarchy.
  - Worker 2: live dashboard data flow and interaction wiring.
  - Worker 3: QA principle audit and failure detection.

## What Worked
- Clear file ownership reduced merge conflicts.
- Parallel execution improved speed.
- QA caught governance gaps early (fake status risk, success wording risk).
- Worker 2 delivered live API routing and strong state handling.

## What Drifted
- Secondary routes still contained static/mock patterns.
- Success wording could overstate result quality when provider response degraded.
- QA report timing did not align with latest merged branch state at one point (stale finding risk).

## False-Positive Signals Observed
- Signal FP-001: Static status text can imply connected/pass without live validation.
- Signal FP-002: Generic success message can hide degraded parser fallback.
- Signal FP-003: UI session-only failures are not durable unless mirrored into persistent logs.
- Signal FP-004: Audit result can be stale if it validates before final merge reconciliation.

## MZTEK Guardrail Updates (Applied in this iteration)
- G-001: Dashboard command result messaging now marks degraded fallback as non-success.
- G-002: Task board route (`/tasks`) moved to live API board columns instead of static mock list.
- G-003: Shared shell copy avoids static pass/connected claims.

## Next Guardrails
- NG-001: Add a persistence path for UI failure events to decision/QA ledger.
- NG-002: Add route-level "live data confidence" badges.
- NG-003: Require final QA pass after all worker merges, not before.
- NG-004: Add test asserting degraded provider response is surfaced as warning/danger state in UI.

## Orchestrator Retrospective
- Effective:
  - Parallel role split by disjoint write sets.
  - Independent QA worker prevented blind acceptance.
- Improve:
  - Trigger final QA validation only after integration branch is settled.
  - Convert QA findings into immediate checklist and enforce before closeout.

## Worker B Update - Minimal Council Mode Guardrail
- Added a dispatch-resilience gate in `src/council/pipeline.js`.
- Rule:
  - If the immediately previous council run had `dispatch_failure` on more than 50% of assignments, the next run uses reduced routing.
  - Reduced routing keeps only `builder` and `false_positive_detector`.
- Decision trace is now explicit and persistent:
  - mode (`full` or `minimal`)
  - dispatch failure rate from previous run
  - selected roles
  - plain-language reason for the routing decision
- Summary now includes dispatch telemetry:
  - `dispatchFailureCount`
  - `dispatchFailureRate`
  - `decisionTrace`
- Backward compatibility preserved:
  - If no prior run exists, council remains in full routing mode.
  - If reduced filtering returns empty, pipeline safely falls back to full routes.
