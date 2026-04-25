# MZTEK Roadmap Extensions

## Purpose

Capture important ideas discovered during product exploration so they are mapped
and revisitable without forcing them into the current MVP prematurely.

## Rules

- Record important ideas early.
- Do not treat every idea as immediate MVP scope.
- Keep a clear split between `now`, `next`, and `later`.
- Preserve the reason each item matters.

## Now

### Prompt Governance Loop
- Make MZTEK the default prompt governor instead of an optional reminder.
- Route user prompts through MZTEK before they reach an IDE or model.
- Require IDE outputs to come back as inspectable artifacts, not trusted chat claims.

### Prompt Feedback Learning
- Analyze prompt outcomes.
- Classify partial, suspicious, blocked, and failed responses.
- Improve the next prompt using real evidence and failure reasons.
- Keep prompt attempts, critiques, and next strategies in a visible prompt ledger.

### GenAI Capability Knowledge
- Build a capability map so MZTEK understands prompting, APIs, RAG, advanced RAG,
  agents, deployment, and model tradeoffs.
- Use that knowledge for prompt shaping, validation, and MVP guidance.

### Existing App Audit Mode
- Support analysis of already-built apps and repos.
- Compare claimed completion to actual code, runtime, validation, and UX truth.
- Produce a fix and improvement plan from the audit.

## Next

### Direct Builder Mode
- Let users work through MZTEK directly instead of relying on AI IDE workflows.
- Use VS Code, terminal, or PowerShell as execution surfaces while MZTEK remains
  the control layer.

### Above-IDE Control Mode
- Keep IDEs as worker environments.
- MZTEK injects the governed prompt envelope by default.
- MZTEK validates returned artifacts and runtime proof outside the IDE.

### Local Small-Build Mode
- Allow simple apps, internal workflows, and small utilities to be built with
  lightweight local models.
- Escalate to cloud only when complexity or quality demands it.

### Scoped Continuous Learning
- Keep lessons local first.
- Separate project-level, workspace-level, and global learning.
- Promote lessons cautiously based on repeated evidence.

### Stronger Multi-Role Review
- Prevent the same worker from acting as builder and judge.
- Use problem analysis, builder, UI/UX review, audit, and QA roles where helpful.
- Catch partial fixes claimed as full fixes.

### Decision Trace Visibility
- Show the structured basis for MZTEK's current decisions inside the dashboard.
- Preserve reasoning basis for later review without exposing raw hidden chain-of-thought.
- Make project-time thinking visible through observed signals, checks, principles, decisions, and next actions.

### Agent Counseling and Strategy Adaptation
- Detect when an IDE or worker repeatedly ignores required execution method or evidence rules.
- Classify the failure type instead of retrying the same correction blindly.
- Escalate through tighter prompts, narrower subtasks, stronger contracts, tool switching, or stop-and-report behavior.
- Preserve corrective guidance so the next retry is based on diagnosed behavior, not repetition.

### Scoped Compliance Memory
- Track lessons at attempt, session, project, tool-profile, and carefully promoted global levels.
- Prevent the same failed correction strategy from being repeated in the same project loop.
- Learn how specific IDEs and worker styles tend to drift without overgeneralizing one bad run to everything.

## Later

### Voice Companion Layer
- Natural spoken updates grounded in real project state.
- User-selectable voice preferences.
- Spoken status, blockers, and next actions.

### IndiaAI / AIKosh Intelligence
- Understand datasets, models, toolkits, and use cases available through AIKosh.
- Recommend India-relevant public resources where useful.
- Help Indian builders avoid reinventing what already exists.

### User-Connected Source Access
- Let users connect their own Google identity to MZTEK.
- Prefer governed source access over anonymous public-link dependency.
- Create a future-safe path for Drive, docs, and NotebookLM-compatible ingestion.

### Discovery and Competitor Research
- Research similar products and comparable approaches.
- Help users sharpen an MVP wedge without overbuilding.
- Capture product differentiation notes and feature sequencing advice.

### Free-Forever Limited Tier
- Provide a permanently free lightweight version for community growth and real-world
  learning.
- Reserve stronger governance, team, and advanced runtime controls for later tiers.

### India Positioning and Ecosystem Path
- Position MZTEK as a trustworthy build-governance layer for AI product building.
- Explore IndiaAI-aligned messaging only after strong product proof exists.
- Track grant, ecosystem, and startup-program readiness separately from MVP work.

## Observed Pain Patterns Worth Preserving

- AI IDEs claim full completion after only partial fixes.
- Tools jump to resolution without proper root-cause analysis.
- Users must repeatedly restate guardrails unless a control layer forces them.
- Non-expert users trust familiar tools like VS Code or PowerShell more than AI-native IDE workflows.
- Existing apps often need audit and hardening more urgently than greenfield builds.

## Reminder

These items are part of the product map, not automatic promises for the next
build loop.
