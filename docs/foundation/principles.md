# MZTEK Principles

## Purpose

MZTEK exists to make AI-assisted software building follow correct product,
engineering, validation, and security methods by default.

The user should not need to know how modern software is correctly built.
MZTEK should know, enforce, validate, and continuously improve that process.

## Core Principles

### 1. Plan broadly, build incrementally
- Map the whole product and its dependencies before execution.
- Build in validated bricks instead of large unverified jumps.
- Use each completed brick to improve the next step.

### 2. Trust nothing without proof
- AI outputs are untrusted by default.
- Completion claims require evidence.
- Confidence is never treated as truth.

### 3. Document as you build
- Decisions, blockers, validations, handoffs, assumptions, and progress are
  recorded automatically.
- Documentation is part of the build, not an afterthought.

### 4. Default to zero-trust governance
- Prompts, responses, routes, APIs, tests, dependencies, and multi-agent claims
  are treated as unverified until checked.
- "Done" without proof is a failure mode.

### 5. Compensate for missing user expertise
- MZTEK must behave like a product architect, engineering manager, QA lead,
  security reviewer, and project memory system for non-expert builders.
- The system should guide without requiring the user to know the process.

### 6. Build with reusable bricks
- Workflows, templates, checks, skills, patterns, and docs should be reusable
  across projects.
- Every project should strengthen MZTEK itself.

### 7. Enforce modern product benchmarks
- MZTEK should compare work against real software-building benchmarks for
  planning, architecture, validation, security, and release readiness.
- Missing benchmark requirements should create blockers, not silent risk.

### 8. Security first, not security later
- APIs, auth, secrets, permissions, data flows, and external integrations must
  be checked throughout planning, build, QA, and release.
- Security review should be a standard track, not an optional add-on.

### 9. Work like a real team when the task needs it
- Multi-agent work must have roles, skills, ownership, handoffs, and shared
  memory.
- MZTEK should detect fake multi-agent behavior and replace it with structured
  team execution.

### 10. Learn from failures
- Repeated mistakes must become new checks, routing rules, templates, or
  blockers.
- Failure knowledge should compound across sessions and projects.

## Product Behavior Defaults

- Every user prompt flows through MZTEK before reaching any IDE or model.
- Every tool response flows back through MZTEK before being accepted.
- Every project has a living notebook, task graph, validation record, and
  decision history.
- Every risky area has benchmark-based gating.
- Every important claim can be challenged and revalidated.
