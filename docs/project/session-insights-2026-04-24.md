# MZTEK Session Insights

## Purpose

Capture the major product truths, pain patterns, feature ideas, positioning
insights, and roadmap extensions discovered across the full conversation so they
do not remain trapped in chat history.

## Core Product Truth

MZTEK is not another AI IDE.

MZTEK is a zero-trust governance layer that sits above IDEs, models, and tools
to ensure software is built with real engineering discipline, real validation,
and real memory.

## Confirmed Problem Statement

Non-technical and semi-technical users can now generate software with AI, but
they usually do not know:
- how to define a product properly
- how to break work into correct phases
- how to validate what is truly complete
- how to detect hidden risk
- how to prevent AI tools from faking success

Current AI IDE tools help generate code, but they often:
- act like solo workers
- jump directly to fixes without diagnosis
- forget context or summarize badly
- claim more than they actually proved
- skip security, architecture, and release discipline

MZTEK should compensate for the user's missing expertise and the IDE's missing
governance.

## Product Definition

MZTEK is a universal, model-agnostic, IDE-agnostic, project-agnostic execution
governance system for AI-assisted software creation.

It should:
- translate rough ideas into buildable product steps
- govern prompts before they reach IDEs or models
- validate outputs with zero trust
- maintain project memory and ledger truth
- stop fake completion
- guide the next correct action
- learn from failures without polluting unrelated projects

## Build Philosophy

Core principles confirmed in this session:
- plan broadly, build incrementally
- trust nothing without proof
- document as you build
- validate continuously
- break work into reusable bricks
- preserve lessons, not just outputs

## What MZTEK Must Know

MZTEK should carry broad software and GenAI-building knowledge, including:
- prompting and prompt structure
- APIs and integrations
- RAG and advanced RAG
- agent and multi-agent patterns
- deployment and production integration
- model tradeoffs and routing
- security, QA, and release readiness
- backend architecture and system design
- tool protocols like MCP and related ecosystem methods

This knowledge should be used for:
- better prompt construction
- better routing
- better validation
- better MVP shaping
- anti-overengineering guidance

Users should benefit from this knowledge without needing to study it directly.

## Control Boundary

One of the strongest conclusions in the conversation:

If MZTEK is optional in the workflow, it will be skipped.

Therefore:
- user should talk to MZTEK first
- MZTEK should send the governed prompt to the IDE or tool
- IDE output should return as inspectable artifacts
- MZTEK should validate before accepting progress

Target flow:

`User -> MZTEK -> IDE/model/tool -> evidence output -> MZTEK validator -> next action`

## Two Important Runtime Modes

### Above-IDE Mode
- user may still keep using VS Code, Cursor, Windsurf, etc.
- MZTEK wraps prompts and governs execution from above

### Direct-Builder Mode
- user works in MZTEK directly
- VS Code or terminal becomes the worker surface underneath
- helpful for non-technical or semi-technical users

## Local/Cloud Strategy

MZTEK should support:
- local-only mode
- hybrid mode
- cloud-assisted mode

Important sub-mode:
- local small-build mode for simple apps, CRUD tools, automations, internal
  dashboards, and Power Apps-style workflows using lightweight local models

## Key Use Cases Confirmed

### 1. Govern new builds
- user gives rough prompt
- MZTEK shapes and routes it
- MZTEK validates returned output

### 2. Audit existing apps
- human-built or AI-built app
- repo, files, docs, runtime, or deployed app inspected
- MZTEK identifies what is real, what is risky, what is missing, and what to fix next

### 3. Improve AI-built products after false confidence
- especially relevant when IDEs claim an app works but proof is weak or incomplete

## Strong Pain Patterns Preserved

- fake "done" without proof
- partial fix claimed as full fix
- code issue fixed but UI/UX issue left unresolved
- no root-cause analysis before implementation
- same agent writes and judges its own work
- weak memory across long build sessions
- prompt repetition burden on users
- environment and command failures misread as code success
- non-expert users not trusting AI-native IDE behavior

## Why MZTEK Is Needed Above IDEs

IDEs usually do not own:
- truth validation
- append-only ledger memory
- architecture governance
- independent QA authority
- environment-aware execution control
- strong done criteria

So MZTEK must own those layers outside the IDE.

## Idea Shaping and Research

MZTEK should eventually help users before they build by:
- researching comparable products
- identifying overlaps and whitespace
- sharpening the MVP wedge
- distinguishing build-now from later ideas

This is especially valuable for non-technical founders and first-time builders.

## Voice and Companion Behavior

MZTEK should eventually feel like a project companion:
- progress updates
- blockers
- next actions
- later voice interaction
- user-selectable voice style

Important rule:
- voice should speak from tracked project truth, not generic assistant chatter

## India / AIKosh / IndiaAI Direction

Important ecosystem insight from the session:
- AIKosh should be treated as an ecosystem input, not a competitor
- MZTEK can use AIKosh datasets, models, toolkits, and use cases as
  India-aware build intelligence
- MZTEK can recommend India-specific resources when relevant

Positioning direction:
- global product
- with strong India-aware resource intelligence and trustworthy build governance

Important caution:
- do not claim government standardization or official compliance too early
- earn that credibility later through mapped controls, proofs, and traction

## GTM and Early Business Thinking

Confirmed strategy directions:
- free-forever limited tier
- early free beta / design partners
- community and real pain collection
- website can start as a lightweight landing page before a full showcase site
- real messaging should come from real user pain, not generic AI copy

## Brutal Strategic Truths Captured

- the idea is not fake or trivial
- many companies build parts of it, not the full combination
- the main risk is not that nobody needs it
- the main risk is that a narrower competitor may explain value faster
- the wedge must stay sharp
- grants and investors are later-stage outcomes, not current focus

## What Should Not Be Lost

- MZTEK must not depend on users remembering to "use MZTEK"
- MZTEK should inject a governed prompt envelope by default
- output should land in inspectable locations
- lessons should be scoped: project, workspace, and global
- MZTEK should support both build mode and audit mode
- MZTEK should help semi-technical users work through familiar tools like VS Code or PowerShell

## Agent Counseling Insight

Another important product truth surfaced later in the conversation:
- when a worker keeps ignoring required method, that is not just implementation failure
- it becomes a control and compliance problem
- MZTEK should not keep repeating the same correction forever

Instead MZTEK should:
- detect repeated non-compliance
- classify the failure cause
- change strategy based on failure type
- tighten control, decompose work, switch tools, or stop automated execution when needed

This "agent counseling" layer is really corrective execution guidance:
- what the worker did wrong
- why that behavior is unsafe or incomplete
- what behavior is required next
- what escalation path applies if the worker still drifts

## Scoped Memory Insight

The conversation also clarified that MZTEK should not learn in one giant memory bucket.

Lessons should be stored in layers:
- attempt memory for the immediate retry loop
- session memory for current run behavior
- project memory for repo- and architecture-specific patterns
- tool-profile memory for how specific IDEs or models tend to drift
- carefully promoted global memory for reusable product-wide lessons

This matters because MZTEK should:
- avoid repeating failed corrections in the same session or project
- understand how certain tools behave over time
- avoid overgeneralizing one bad run into global permanent bias

## Best Current Wedge

The strongest near-term wedge appears to be:

`Catch fake completion, audit AI-built apps, and guide the next trusted iteration.`

That is easier to explain than the whole long-term vision and still fits the
larger platform.

## Status of Capture

This file is not the roadmap itself.
It is the session distillation layer that preserves product-discovery insight
for future roadmap and implementation decisions.
