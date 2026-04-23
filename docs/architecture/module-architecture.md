# MZTEK Module Architecture

## System Shape

MZTEK should be structured as a layered control plane above IDEs, models,
agents, and execution tools.

## Layer 1: User Experience Layer

### Modules
- Builder chat
- Dashboard
- Task views
- Conversation views
- Project notebook views
- Project Pulse
- Voice Companion

### Responsibilities
- Accept rough user intent
- Show current project truth
- Surface blockers, ownership, and next steps
- Provide human-friendly explanations
- Provide concise state-aware progress updates without requiring the user to inspect raw logs
- Support natural spoken project updates and questions from grounded state

## Layer 2: Governance Core

### Modules
- Intent interpreter
- Idea shaper
- Market intelligence engine
- Context engine
- Task graph engine
- Zero-trust validator
- Benchmark engine
- Status engine
- Documentation engine

### Responsibilities
- Turn intent into structured work
- turn rough ideas into clearer product directions
- compare user ideas with known market alternatives
- Load the right context for each action
- Maintain truth about progress and blockers
- Validate outputs before acceptance
- Enforce benchmark and process rules
- Keep documentation synchronized with work

## Layer 3: Team and Learning Layer

### Modules
- Agent topology engine
- Skill registry
- Handoff manager
- Shared memory coordinator
- Lesson engine
- Failure engine
- Pattern engine

### Responsibilities
- Build structured teams when needed
- Assign work by skill and scope
- Track communication and ownership
- Learn from failures and successful patterns
- Improve future routing and checks

## Layer 4: Execution Routing Layer

### Modules
- Provider router
- Capability registry
- Privacy and policy engine
- Cost engine
- Escalation engine
- Prompt middleware

### Responsibilities
- Choose local versus cloud models
- Select the smallest capable execution path
- Enforce privacy and cost policies
- Escalate when complexity or risk demands it
- Enrich prompts before execution

## Layer 5: Integration Layer

### Modules
- IDE adapters
- Model adapters
- CLI and tool adapters
- MCP integration
- Evidence ingestion pipeline

### Responsibilities
- Connect to external tools and execution environments
- Normalize responses and outputs
- Collect evidence from builds, tests, file edits, and tool calls

## Layer 6: Persistence Layer

### Modules
- Project notebook store
- Decision store
- Task store
- Validation store
- Lesson and failure store
- Reusable asset store

### Responsibilities
- Persist knowledge and state per project
- Support resumability
- Keep reusable artifacts available across projects

## Canonical Runtime Flow

1. User sends a rough request in chat.
2. Intent interpreter classifies the task.
3. If the task is idea-stage, the idea shaper and market intelligence engine clarify the concept and compare it with available alternatives.
4. Context engine loads project state, recent decisions, and relevant benchmark rules.
5. Task graph engine links the request to existing work or creates new work.
6. Benchmark and validator determine the required build and proof path.
7. Provider router selects the best execution path.
8. Prompt middleware sends a governed prompt to the chosen tool/model.
9. Response returns through evidence ingestion.
10. Zero-trust validator checks claims, missing proof, contradictions, and risks.
11. Status engine accepts, blocks, downgrades, or routes for fix.
12. Documentation and learning layers update the notebook, tasks, decisions, and lessons.
13. Dashboard, Project Pulse, and Voice Companion reflect the new project state.

## Foundational Dependencies

- Project notebook is required before strong validation can be meaningful.
- Task graph is required before ownership and handoff tracking can work.
- Zero-trust validation is required before reliable status can exist.
- Provider routing becomes strong only after context and risk classification exist.
- Team orchestration becomes strong only after task graph and skill registry exist.
