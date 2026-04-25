# MZTEK Build Board

## Goal
Reach a usable MVP that proves MZTEK can capture project context, track work, and reject fake completion claims.

## Roles
- `Core Lead`: architecture, integration, final review
- `Memory Lead`: project notebook and decision records
- `Validation Lead`: zero-trust checks and evidence rules
- `Tracking Lead`: tasks, blockers, ownership, status model

## Board
| ID | Task | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| MZ-001 | Define MVP scope and acceptance criteria | Core Lead | Done | Foundation for all follow-on work |
| MZ-002 | Define project notebook document set | Memory Lead | Ready | Needs file/schema decisions |
| MZ-003 | Define task and blocker tracking model | Tracking Lead | Ready | Must support owner, status, evidence |
| MZ-004 | Define zero-trust validation rules for "done" claims | Validation Lead | Ready | Focus on proof vs claim |
| MZ-005 | Create first implementation plan for notebook core | Core Lead | Backlog | Starts after MZ-002 to MZ-004 are aligned |
| MZ-006 | Capture roadmap extensions from live product discovery | Core Lead | Done | Stored in `docs/project/roadmap-extensions.md` so strategic ideas are not lost |
| MZ-006A | Distill full session history into structured project memory | Core Lead | Done | Stored in `docs/project/session-insights-2026-04-24.md` |
| MZ-007 | Design prompt dispatch plus evidence return loop | Core Lead | Ready | Core control-boundary work for MZTEK-first execution |
| MZ-008 | Define audit mode for existing apps and repos | Validation Lead | Backlog | Important early wedge beyond greenfield build mode |
| MZ-009 | Define local small-build mode for lightweight local models | Core Lead | Backlog | Supports low-cost internal tools and privacy-first users |
| MZ-010 | Define AIKosh and India-aware recommendation path | Product Brain | Backlog | Later positioning and India-specific build acceleration |
| MZ-011 | Add user-connected source API foundation | Core Lead | Done | Added Google OAuth API scaffold for user-owned source access |
| MZ-012 | Build first local dashboard with decision trace | Core Lead | Done | Local dashboard server added with project truth and Decision Trace view |
| MZ-013 | Add prompt ledger foundation to project state and UI | Core Lead | Done | Prompt runs are now stored, queryable in CLI, and visible in the dashboard |
| MZ-014 | Define agent counseling and strategy adaptation model | Core Lead | Ready | Needed when workers keep ignoring governed execution method |
| MZ-015 | Define scoped compliance memory across attempt, session, project, tool, and global levels | Memory Lead | Ready | Needed so corrective learning persists without poisoning unrelated work |
| MZ-016 | Add QA review ledger and dashboard visibility for builder-vs-QA communication | Core Lead | In Progress | Needed so users can see side-by-side build and QA communication in project truth |

## Status Legend
- `Backlog`: not started
- `Ready`: clear enough to start
- `In Progress`: active work
- `Blocked`: waiting on dependency
- `Done`: completed and reviewed

## Current Focus
- Lock the MVP boundary
- Keep work broken into reusable bricks
- Track ownership before implementation expands
- Preserve strategic discoveries in a mapped backlog instead of leaving them in chat only
