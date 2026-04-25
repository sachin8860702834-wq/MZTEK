# MZTEK Source of Truth

## What MZTEK Is

MZTEK is a zero-trust governance layer for AI-assisted software creation.

It is not just another AI coding IDE or coding assistant. Its job is to sit
above IDEs, models, agents, and tools and make sure software is built with:
- real validation
- real evidence
- real project memory
- real security and quality discipline

## The Core Problem

AI coding tools can generate code quickly, but they often:
- claim success without proof
- fix one part and pretend the whole issue is fixed
- skip root-cause analysis
- forget context across sessions
- let one agent write code and judge its own output
- optimize for finishing a prompt instead of shipping a trustworthy product

MZTEK exists to solve that gap.

## Core Product Truth

If MZTEK is optional in the workflow, it will be skipped.

So the intended operating model is:

`User -> MZTEK -> IDE/model/tool -> evidence output -> MZTEK validator -> next action`

This means:
- user talks to MZTEK first
- MZTEK builds the governed prompt
- IDE or tool acts as the worker
- MZTEK validates what came back
- MZTEK decides whether work is accepted, blocked, or sent for improvement

## Who It Is For

MZTEK is especially valuable for:
- non-technical users building with AI tools
- semi-technical founders
- product and ops people who trust familiar tools like VS Code or PowerShell
- teams using AI IDEs but not fully trusting their output
- users who already have an AI-built app and want an audit and improvement plan

## Main User Value

MZTEK should help users by:
- turning rough ideas into structured product steps
- governing prompts before they reach IDEs or models
- validating work with zero trust
- showing what is real, missing, risky, or fake-complete
- tracking decisions, blockers, and next actions
- improving future prompts and checks from evidence

## Current Strongest Wedge

The best near-term wedge is:

`Catch fake completion, audit AI-built apps, and guide the next trusted iteration.`

This is easier to explain than the full long-term platform and still fits the
larger vision.

## Current Product Modes

### Build Mode

MZTEK governs new software creation by:
- shaping prompts
- routing execution
- requiring evidence
- tracking project truth

### Audit Mode

MZTEK inspects an already-built app or repo and identifies:
- what is actually implemented
- what is risky
- what is missing
- what was falsely claimed complete
- what should be fixed next

## Important Design Principles

- Plan broadly, build incrementally.
- Trust nothing without proof.
- Document as you build.
- Validate continuously.
- Break work into reusable bricks.
- Preserve lessons, not just outputs.

## Important Product Capabilities

### Project Truth
- task tracking
- decision tracking
- validation history
- blockers and next steps

### Zero-Trust Validation
- claim versus evidence checks
- fake-done detection
- dependency checks
- missing-proof detection
- benchmark-aware validation

### Prompt Governance
- MZTEK wraps prompts with context, rules, and proof requirements
- MZTEK improves prompts after failures instead of repeating weak requests

### Decision Trace
- MZTEK shows the structured basis for its current decisions
- this is meant for trust, review, and later code audit
- it should expose observed signals, checks, principles, decisions, missing proof, and next action

### GenAI Capability Knowledge

MZTEK should understand modern AI-product building, including:
- prompting
- APIs
- RAG and advanced RAG
- agents and multi-agent systems
- deployment
- model routing and tradeoffs

This knowledge should be used to improve prompt quality, validation, and MVP guidance.

## Local and Cloud Strategy

MZTEK should support:
- local-only workflows
- hybrid local/cloud workflows
- cloud-assisted execution

It should also support a local small-build mode for:
- simple workflows
- internal tools
- CRUD apps
- dashboard utilities
- small Power Apps-style products

## Dashboard Direction

MZTEK includes a dashboard that should show:
- project overview
- current phase and active task
- task board
- validation and benchmark gaps
- recent decisions
- capability gains
- a Decision Trace panel

The dashboard should behave like a live project surface, not a static report.

## Current Roadmap Direction

### Current Focus
- prompt governance loop
- prompt feedback learning
- capability-aware knowledge selection
- dashboard and decision trace
- project truth and validation

### Next Important Areas
- direct-builder mode
- stronger above-IDE control mode
- local small-build mode
- scoped continuous learning
- stronger multi-role review

### Later Areas
- voice companion
- IndiaAI / AIKosh-aware recommendations
- user-connected source access
- competitor and idea-shaping research
- free-forever limited tier

## IndiaAI / AIKosh Positioning

MZTEK should be global, but it should also understand India-specific AI ecosystem resources.

AIKosh and IndiaAI should be treated as ecosystem inputs, not competitors.

MZTEK can later use them for:
- recommending relevant datasets and models
- suggesting existing Indian use cases and toolkits
- helping Indian builders avoid reinventing what already exists

## Business Direction

The early strategy is:
- free-forever limited tier
- real usage and community learning
- real pain collection from users of IDEs and AI coding tools
- grow trust and clarity before heavy monetization

It is too early to optimize for grants or investor narrative before product proof exists.

## Current Maturity

MZTEK is currently in an early core MVP phase with:
- CLI foundation
- local state store
- validation engine
- sample-project seeding
- benchmark-aware validation
- dashboard prototype
- decision trace prototype

## One-Line Summary

MZTEK is the truth, validation, and governance layer above AI coding tools that helps users build software more reliably than AI IDEs alone.
