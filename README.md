# MZTEK

MZTEK is a zero-trust governance layer for AI-assisted software creation.

This workspace starts with the product foundation pack so planning, implementation,
testing, and iteration all build from one source of truth.

## Foundation Pack

- [Principles](E:\MZTEK\docs\foundation\principles.md)
- [Product Boundary](E:\MZTEK\docs\foundation\product-boundary.md)
- [MVP Definition](E:\MZTEK\docs\foundation\mvp-definition.md)
- [Master Feature Inventory](E:\MZTEK\docs\foundation\feature-inventory.md)
- [Module Architecture](E:\MZTEK\docs\architecture\module-architecture.md)
- [Discovery and Companion Architecture](E:\MZTEK\docs\architecture\discovery-and-companion-architecture.md)
- [GenAI Capability Map](E:\MZTEK\docs\architecture\genai-capability-map.md)
- [Prompt Feedback Architecture](E:\MZTEK\docs\architecture\prompt-feedback-architecture.md)
- [User-Connected Source API](E:\MZTEK\docs\architecture\user-connected-source-api.md)
- [Dashboard Decision Trace](E:\MZTEK\docs\architecture\dashboard-decision-trace.md)
- [Phase Roadmap](E:\MZTEK\docs\foundation\phase-roadmap.md)

## NotebookLM Export

- [NotebookLM Source of Truth](E:\MZTEK\docs\exports\notebooklm\mztek-source-of-truth.md)

## Working Rule

Plan broadly, build incrementally, validate continuously.

## Control Room

Start the dashboard:

```powershell
npm run dashboard
```

Open:

- `http://localhost:4321`

Development alias:

```powershell
npm run dev
```

If port `4321` is already in use:

```powershell
node E:\MZTEK\src\cli.js dashboard --project=E:\MZTEK --port=4322
```

The startup message prints the exact working URL. If the port is busy, the CLI returns a clear error instead of silently failing.

Project switcher:

- `/?project=mztek`
- `/?project=career-mantra`

Inside the dashboard you can now:

- type what you want to build in the command box
- attach files and links
- see the current step and next action at the top
- analyze the current project first
- start from the current project
- connect NVIDIA from a masked dashboard field with real validation feedback
- connect GitHub through the official device flow once the server-side GitHub OAuth client is configured
- reload controlled project context
- inspect the work board, activity feed, decision log, team briefing, and integration status
- see permission-driven prompts when GitHub or NVIDIA setup is still missing

Dashboard-first connection flows:

- `Connect GitHub`
  - starts the official GitHub device flow
  - opens the GitHub verification page
  - stores the resulting access token encrypted server-side
  - validates the account with `GET /user`
  - validates repo access when a repo URL is attached
- `Connect NVIDIA`
  - accepts the NVIDIA API key through a password-masked dashboard field
  - stores the key encrypted server-side
  - validates the key through `GET /v1/models`
  - exposes only connection status and model names back to the dashboard

Encrypted local connection material is stored under:

- `E:\\MZTEK\\.mztek\\secure\\`

Those files are ignored from git and the dashboard never prints raw secrets.

## NVIDIA Integration

The dashboard exposes:

- `POST /api/nvidia-chat`
- `POST /api/analyze-project`
- `POST /api/nvidia/validate`
- `POST /api/github/connect`
- `POST /api/github/poll`

Environment variables:

```powershell
$env:NVIDIA_API_KEY=""
$env:NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
$env:NVIDIA_DEFAULT_MODEL=""
```

Optional server-side GitHub device flow config:

```powershell
$env:MZTEK_GITHUB_CLIENT_ID=""
```

Behavior:

- if no NVIDIA key has been connected, the dashboard uses mock mode
- if NVIDIA is connected through the dashboard, it validates the key with `/v1/models` and stores it encrypted server-side
- if the GitHub OAuth client id is missing on the server, GitHub connect returns a clear setup error instead of a fake connected state
- if the GitHub device flow is approved, the dashboard stores the token encrypted server-side and validates the account before showing `Connected`

Current scope:

- interactive goal input
- file-name based upload context
- GitHub / website / product link context
- project-first analysis flow
- integration status cards
- generated work board
- activity feed
- decision log, decisions, and risks

This is still a prototype control room, not the full MZTEK execution engine yet.
