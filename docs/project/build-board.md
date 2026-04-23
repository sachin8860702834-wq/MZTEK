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
