# MZTEK Phase Roadmap

## Build Strategy

Plan broadly, build incrementally, validate continuously.

Each phase should end with:
- a usable artifact
- a test pass against real scenarios
- a documented gap list
- a fix iteration

## Phase 0: Foundation Pack

### Goal
Create the authoritative product map so work does not drift.

### Deliverables
- Principles
- Master feature inventory
- Module architecture
- Phase roadmap

## Phase 1: Project Notebook Core

### Goal
Give every project a grounded memory and documentation system.

### Deliverables
- Project brief format
- Decision log
- Progress log
- Blocker log
- Validation record
- Resume summary generation

### Success Test
- A user can leave and return without losing project state.

## Phase 2: Task and Work Graph

### Goal
Track what is being built, by whom, and what is blocked.

### Deliverables
- Task model
- Dependency model
- Status engine
- Ownership model
- Activity timeline

### Success Test
- The system can clearly answer what is pending on who and why.

## Phase 3: Zero-Trust Validation Core

### Goal
Catch fake completion and require proof before acceptance.

### Deliverables
- Claim versus evidence checks
- Missing-proof detection
- Fake-done detection
- Status downgrade rules
- Validation checklist engine

### Success Test
- The system rejects shallow completion claims in realistic build scenarios.

## Phase 4: Builder Chat Middleware

### Goal
Make every prompt pass through MZTEK by default.

### Deliverables
- Builder chat UI
- Prompt enrichment layer
- Context injection
- Response audit loop
- Suggested next-step flow
- Prompt feedback loop
- Prompt ledger and critique path

### Success Test
- User rough prompts are automatically translated into governed execution requests.
- Failed prompt outcomes lead to a better next prompt instead of repeating the same mistake.

## Phase 5: Dashboard MVP

### Goal
Show project truth clearly and continuously.

### Deliverables
- Overview page
- Task board
- Agent activity panel
- Conversation threads
- Validation and blocker views

### Success Test
- A user can understand project state within 10 seconds.

## Phase 5.5: Discovery Intelligence

### Goal
Help users shape ideas before overbuilding by researching the market and
comparing their concept with existing alternatives.

### Deliverables
- idea-shaping workflow
- comparable product discovery
- MVP wedge guidance
- differentiation notes

### Success Test
- A rough user idea can be turned into a sharper MVP direction with clear
  "build now" versus "later" guidance.

## Phase 6: Benchmark and Security Packs

### Goal
Enforce modern software-building methods and security-first review.

### Deliverables
- Universal product benchmark
- Security-first checks
- API/auth/release validation packs
- Readiness scoring

### Success Test
- Risky projects get blocked or downgraded when benchmark requirements are missing.

## Phase 7: IDE and Provider Integrations

### Goal
Connect MZTEK to tools while keeping vendor independence.

### Deliverables
- IDE adapters
- Model/provider adapters
- Evidence ingestion from tools
- Local/cloud routing baseline

### Success Test
- MZTEK can govern execution through at least one IDE path and one model path.

## Phase 8: Agent and Team System

### Goal
Replace fake multi-agent behavior with structured team execution.

### Deliverables
- Team topology engine
- Skill registry
- Agent role templates
- Handoff protocol
- Shared memory coordination

### Success Test
- Multi-agent work is traceable, scoped, and validated instead of decorative.

## Phase 9: Learning and Reuse Engine

### Goal
Turn project experience into better future behavior.

### Deliverables
- Lessons engine
- Failure taxonomy
- Pattern extraction
- Reusable workflow packs
- Cross-project reuse path

### Success Test
- Repeated mistakes become automated checks and reusable fixes.

## Phase 10: Voice Companion Layer

### Goal
Provide natural spoken project updates and spoken project-state interaction based
on real tracked data.

### Deliverables
- voice pulse summaries
- spoken project-state answers
- user-selectable voice preferences
- grounded voice update rules

### Success Test
- The system can speak accurate project updates and answer spoken status
  questions without inventing project state.

## Initial Build Recommendation

The first implementation loop should target:
- Phase 1
- Phase 2
- Phase 3

These create the core reusable bricks:
- grounded project memory
- project tracking
- zero-trust enforcement

Everything else becomes stronger once those exist.
