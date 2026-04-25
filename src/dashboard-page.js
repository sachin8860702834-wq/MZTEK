function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toneClass(value = "") {
  const normalized = String(value).toLowerCase();
  if (["done", "validated", "active", "high", "connected", "pass", "ready"].includes(normalized)) {
    return "tone-good";
  }
  if (["blocked", "failed", "critical", "needs_validation", "not_connected"].includes(normalized)) {
    return "tone-bad";
  }
  if (["partial", "claimed_done", "medium", "queued", "pending"].includes(normalized)) {
    return "tone-warn";
  }
  return "tone-neutral";
}

function renderProjectTabs(data) {
  return data.availableProjects
    .map((project) => {
      const active = project.key === data.selectedProjectKey ? "is-active" : "";
      return `
        <a class="project-tab ${active}" href="/?project=${encodeURIComponent(project.key)}">
          <span class="project-tab-label">${escapeHtml(project.label)}</span>
          <span class="project-tab-path">${escapeHtml(project.projectDir)}</span>
        </a>
      `;
    })
    .join("");
}

function renderBoardColumns(columns) {
  return columns
    .map((column) => {
      const items = column.items.length
        ? column.items
            .map(
              (item) => `
                <article class="board-card">
                  <div class="board-card-head">
                    <span class="board-card-id">${escapeHtml(item.id)}</span>
                    <span class="board-chip ${toneClass(item.status)}">${escapeHtml(item.status)}</span>
                  </div>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                  <div class="board-card-meta">
                    <span>Proof: ${escapeHtml(item.proof)}</span>
                    <span>${escapeHtml(item.updatedAt)}</span>
                  </div>
                </article>
              `
            )
            .join("")
        : `<div class="board-empty">No items yet.</div>`;

      return `
        <section class="board-column">
          <header class="board-column-head">
            <h3>${escapeHtml(column.title)}</h3>
            <span>${column.items.length}</span>
          </header>
          <div class="board-column-body">${items}</div>
        </section>
      `;
    })
    .join("");
}

function renderActivityFeed(items) {
  if (!items.length) {
    return `<div class="feed-empty">No activity recorded yet.</div>`;
  }

  return items
    .map(
      (item) => `
        <article class="feed-item">
          <div class="feed-marker ${toneClass(item.kind)}"></div>
          <div class="feed-body">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.detail)}</p>
            <span>${escapeHtml(item.at)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPromptCards(items) {
  if (!items.length) {
    return `<div class="ledger-empty">No prompt runs recorded yet.</div>`;
  }

  return items
    .map(
      (item) => `
        <article class="ledger-card">
          <div class="ledger-head">
            <span>${escapeHtml(item.id)}</span>
            <span class="board-chip ${toneClass(item.outcome)}">${escapeHtml(item.outcome)}</span>
          </div>
          <h3>${escapeHtml(item.taskId)} via ${escapeHtml(item.target)}</h3>
          <p><strong>Intent:</strong> ${escapeHtml(item.userIntent)}</p>
          <p><strong>Prompt:</strong> ${escapeHtml(item.governedPrompt)}</p>
          <p><strong>Response:</strong> ${escapeHtml(item.responseSummary || item.expectedOutcome)}</p>
          <p><strong>Critique:</strong> ${escapeHtml(item.critique || "No critique recorded.")}</p>
          <p><strong>Next:</strong> ${escapeHtml(item.nextPromptStrategy || "No next strategy recorded.")}</p>
        </article>
      `
    )
    .join("");
}

function renderReviewCards(items) {
  if (!items.length) {
    return `<div class="ledger-empty">No QA reviews recorded yet.</div>`;
  }

  return items
    .map(
      (item) => `
        <article class="ledger-card">
          <div class="ledger-head">
            <span>${escapeHtml(item.id)}</span>
            <span class="board-chip ${toneClass(item.severity)}">${escapeHtml(item.severity)}</span>
          </div>
          <h3>${escapeHtml(item.taskId)} review for ${escapeHtml(item.promptId)}</h3>
          <p><strong>Reviewer:</strong> ${escapeHtml(item.reviewer)}</p>
          <p><strong>Failure class:</strong> ${escapeHtml(item.failureClass)}</p>
          <p><strong>Critique:</strong> ${escapeHtml(item.critique || "No critique recorded.")}</p>
          <p><strong>Evidence gap:</strong> ${escapeHtml(item.evidenceGap || "No evidence gap recorded.")}</p>
          <p><strong>Recommended:</strong> ${escapeHtml(item.recommendedAction || "No next action recorded.")}</p>
        </article>
      `
    )
    .join("");
}

function renderDecisionLog(items) {
  if (!items.length) {
    return `<div class="ledger-empty">No decision log entries yet.</div>`;
  }

  return items
    .map(
      (item) => `
        <article class="decision-item">
          <strong>${escapeHtml(item.decision)}</strong>
          <p><strong>Reason:</strong> ${escapeHtml(item.reason)}</p>
          <p><strong>Evidence:</strong> ${escapeHtml(item.evidence)}</p>
          <p><strong>Impact:</strong> ${escapeHtml(item.impact)}</p>
          <p class="muted">${escapeHtml(item.at)}</p>
        </article>
      `
    )
    .join("");
}

function renderIntegrations(items) {
  if (!items.length) {
    return `<div class="ledger-empty">No integrations recorded yet.</div>`;
  }

  return items
    .map(
      (item) => `
        <article class="context-item">
          <div class="integration-head">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="board-chip ${toneClass(item.status)}">${escapeHtml(item.status)}</span>
          </div>
          <p>${escapeHtml(item.summary || item.detail || "")}</p>
          ${item.username ? `<p><strong>User:</strong> ${escapeHtml(item.username)}</p>` : ""}
          ${item.permissionStatus ? `<p><strong>Permission:</strong> ${escapeHtml(item.permissionStatus)}</p>` : ""}
          ${item.model ? `<p><strong>Active model:</strong> ${escapeHtml(item.model)}</p>` : ""}
          ${item.models?.length ? `<p><strong>Models:</strong> ${escapeHtml(item.models.join(", "))}</p>` : ""}
          ${item.baseUrl ? `<p><strong>Path / URL:</strong> ${escapeHtml(item.baseUrl)}</p>` : ""}
          ${item.warning ? `<p class="muted">${escapeHtml(item.warning)}</p>` : ""}
        </article>
      `
    )
    .join("");
}

function renderPermissionActions(items) {
  if (!items || !items.length) {
    return `<div class="muted">No pending permission requests.</div>`;
  }

  return items.map((item) => `<button class="ghost permission-btn" type="button">${escapeHtml(item)}</button>`).join("");
}

export function renderDashboardPage(data) {
  const validation = data.latestValidation;
  const trace = data.decisionTrace;
  const live = data.workspaceLive;
  const refreshedAt = data.generatedAt || new Date().toISOString();
  const seedJson = JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MZTEK Control Room</title>
    <style>
      :root {
        --ink: #112033;
        --muted: #5f6f80;
        --paper: #f6f2e9;
        --panel: rgba(255, 253, 248, 0.88);
        --panel-strong: #fffdf8;
        --line: rgba(17, 32, 51, 0.1);
        --accent: #0f7b6c;
        --accent-2: #d97706;
        --good: #13795b;
        --warn: #a16207;
        --bad: #b42318;
        --shadow: 0 20px 60px rgba(17, 32, 51, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        font-family: "Segoe UI", "Aptos", Arial, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(15,123,108,0.18), transparent 28%),
          radial-gradient(circle at bottom right, rgba(217,119,6,0.12), transparent 22%),
          linear-gradient(180deg, #fbf8f2 0%, #efe6d6 100%);
      }
      .shell { width: min(1500px, calc(100vw - 28px)); margin: 18px auto 28px; }
      .panel, .hero, .workspace, .modal-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(14px);
      }
      .hero { padding: 24px; display: grid; gap: 18px; }
      .hero-top { display: flex; justify-content: space-between; gap: 18px; align-items: start; }
      .eyebrow {
        display: inline-block; margin-bottom: 10px; color: var(--accent);
        font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      }
      h1, h2, h3, p { margin: 0; }
      .hero h1 { font-size: clamp(34px, 5vw, 56px); line-height: 0.95; margin-bottom: 10px; max-width: 10ch; }
      .hero p { color: var(--muted); line-height: 1.55; }
      .hero-meta { display: grid; gap: 10px; min-width: 280px; }
      .meta-card, .status-card, .input-panel, .upload-panel, .context-item, .decision-item, .risk-item, .board-card, .ledger-card, .feed-body {
        background: rgba(255,255,255,0.75); border: 1px solid var(--line); border-radius: 18px;
      }
      .meta-card, .status-card, .input-panel, .upload-panel, .panel { padding: 16px; }
      .meta-card strong { display: block; font-size: 22px; }
      .control-strip { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 14px; }
      .status-card strong { display: block; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
      .status-card p { font-size: 18px; color: var(--ink); }
      .intake { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; }
      .prompt-box, .link-row input, .field input, .field select {
        width: 100%; border: 1px solid rgba(17,32,51,0.12); background: #fffdf8; border-radius: 14px; padding: 12px 14px; color: var(--ink); font: inherit;
      }
      .prompt-box { min-height: 110px; resize: vertical; }
      .action-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
      .button, .ghost {
        padding: 11px 16px; border-radius: 999px; font: inherit; border: 1px solid var(--line); text-decoration: none;
        display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
      }
      .button { background: linear-gradient(135deg, var(--accent), #0a5e53); color: white; border: none; }
      .ghost { background: rgba(255,255,255,0.8); color: var(--ink); }
      .ghost:disabled, .button:disabled { opacity: 0.6; cursor: not-allowed; }
      .upload-grid, .link-grid, .context-list, .decision-list, .risk-list, .feed, .decision-trace { display: grid; gap: 10px; }
      .chat-history { display: grid; gap: 10px; margin-top: 12px; max-height: 260px; overflow: auto; padding-right: 4px; }
      .chat-item { padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255,255,255,0.72); }
      .chat-item strong { display: block; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
      .upload-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 12px; }
      .upload-tile { padding: 14px; border-radius: 18px; border: 1px dashed rgba(17,32,51,0.2); background: rgba(255,255,255,0.76); }
      .project-strip { display: grid; gap: 12px; margin-top: 18px; }
      .project-tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
      .project-tab { text-decoration: none; color: inherit; padding: 16px; border-radius: 20px; border: 1px solid var(--line); background: rgba(255,255,255,0.72); }
      .project-tab.is-active { border-color: rgba(15,123,108,0.35); background: linear-gradient(180deg, rgba(15,123,108,0.14), rgba(255,255,255,0.9)); }
      .project-tab-label { display: block; font-weight: 700; }
      .project-tab-path { display: block; margin-top: 6px; color: var(--muted); font-size: 12px; }
      .workspace { margin-top: 18px; padding: 18px; }
      .workspace-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr) 360px; gap: 18px; }
      .stack { display: grid; gap: 18px; }
      .panel h2 { font-size: 18px; margin-bottom: 12px; }
      .context-item, .decision-item, .risk-item, .board-card, .ledger-card, .feed-body { padding: 12px 14px; }
      .board-wrap { overflow-x: auto; padding-bottom: 4px; }
      .board { display: grid; grid-template-columns: repeat(8, minmax(240px, 1fr)); gap: 14px; min-width: 1320px; }
      .board-column { border-radius: 18px; background: rgba(255,255,255,0.62); border: 1px solid var(--line); padding: 12px; display: grid; gap: 12px; align-content: start; }
      .board-column-head, .board-card-head, .ledger-head, .integration-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
      .board-card-id { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
      .board-chip { padding: 5px 9px; border-radius: 999px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      .feature-chip { display: inline-flex; margin-left: 8px; vertical-align: middle; }
      .tone-good { background: rgba(19,121,91,0.12); color: var(--good); }
      .tone-warn { background: rgba(161,98,7,0.12); color: var(--warn); }
      .tone-bad { background: rgba(180,35,24,0.12); color: var(--bad); }
      .tone-neutral { background: rgba(17,32,51,0.08); color: var(--muted); }
      .board-card h3, .ledger-card h3 { font-size: 15px; margin-bottom: 8px; }
      .board-card p, .ledger-card p, .feed-body p, .decision-item p, .context-item p { font-size: 13px; color: var(--muted); line-height: 1.45; margin-top: 6px; }
      .board-card-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; font-size: 12px; color: var(--muted); }
      .board-empty, .feed-empty, .ledger-empty, .empty, .muted { color: var(--muted); font-size: 13px; }
      .feed-item { display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: 12px; align-items: start; }
      .feed-marker { width: 10px; height: 10px; border-radius: 999px; margin-top: 8px; background: rgba(17,32,51,0.2); }
      .feed-body span { display: inline-block; margin-top: 8px; color: var(--muted); font-size: 12px; }
      .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-top: 18px; }
      .trace-row { padding: 12px 14px; border-radius: 16px; border-left: 4px solid var(--accent); background: rgba(255,255,255,0.74); border-top: 1px solid var(--line); border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
      .ledger-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
      .full-width { margin-top: 18px; }
      .hero-hidden { display: none; }
      .modal {
        position: fixed; inset: 0; background: rgba(17, 32, 51, 0.42); display: none; align-items: center; justify-content: center; padding: 20px; z-index: 20;
      }
      .modal.is-open { display: flex; }
      .modal-card { width: min(560px, 100%); padding: 22px; }
      .modal-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 12px; }
      .modal-head button { border: none; background: transparent; font-size: 22px; cursor: pointer; color: var(--muted); }
      .field { display: grid; gap: 8px; margin-top: 12px; }
      .device-box { margin-top: 14px; padding: 14px; border-radius: 18px; background: rgba(15,123,108,0.08); border: 1px solid rgba(15,123,108,0.16); }
      .device-code { font-size: 28px; letter-spacing: 0.18em; font-weight: 700; margin: 10px 0; }
      @media (max-width: 1200px) {
        .workspace-grid, .summary-grid, .ledger-grid, .intake, .control-strip { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">MZTEK Control Room</div>
            <h1>${escapeHtml(data.project.name)}</h1>
            <p id="project-summary">${escapeHtml(data.project.summary)}</p>
          </div>
          <div class="hero-meta">
            <div class="meta-card"><strong>${escapeHtml(validation.score)}</strong><span>Trust score</span></div>
            <div class="meta-card"><strong id="project-type">${escapeHtml(data.project.type)}</strong><span>Detected project type</span></div>
            <div class="meta-card"><strong>${escapeHtml(refreshedAt)}</strong><span>Last refreshed</span></div>
          </div>
        </div>

        <section class="control-strip">
          <div class="status-card"><strong>Current Step</strong><p id="current-step">${escapeHtml(data.controller?.currentStep || "Ready")}</p></div>
          <div class="status-card"><strong>Next Action</strong><p id="next-action">${escapeHtml(data.controller?.nextAction || "Start from current project to begin.")}</p></div>
          <div class="status-card"><strong>Controller Mode</strong><p id="controller-mode">${escapeHtml(data.controller?.mode || "observer")}</p></div>
        </section>

        <section class="panel">
          <h2>Onboarding Flow</h2>
          <div class="context-list">
            <div class="context-item">
              <strong id="onboarding-prompt">${escapeHtml(data.onboarding?.prompt || "Do you want MZTEK to analyze this project?")}</strong>
              <p class="muted">Use the actions below to let MZTEK understand the current workspace, create the first work board, and switch into controller mode.</p>
            </div>
            <div class="context-item">
              <strong>Permission-Driven Actions</strong>
              <div id="permission-root" class="action-row">${renderPermissionActions(data.controller?.permissions || [])}</div>
            </div>
          </div>
        </section>

        <section class="intake">
          <div class="input-panel">
            <div class="eyebrow">Command Box <span id="chat-feature-badge" class="board-chip tone-warn feature-chip hero-hidden">Experimental (Disabled)</span></div>
            <textarea id="goal-input" class="prompt-box" placeholder="What do you want to build?">${escapeHtml(live.current_task || "")}</textarea>
            <div class="action-row">
              <button id="start-btn" class="button" type="button">Run Control Room</button>
              <button id="analyze-btn" class="ghost" type="button">Analyze project first</button>
              <button id="load-context-btn" class="ghost" type="button">Load current project context</button>
              <button id="start-project-btn" class="ghost" type="button">Start from current project</button>
              <button id="connect-github-btn" class="ghost" type="button">Connect GitHub</button>
              <button id="connect-nvidia-btn" class="ghost" type="button">Connect NVIDIA</button>
              <label class="ghost" for="file-input">Add files</label>
              <button class="ghost" type="button">Export report</button>
              <button class="ghost" type="button">Project snapshot</button>
            </div>
            <p id="run-status" class="muted" style="margin-top:12px;">Ready to generate structured work from the current goal.</p>
            <div id="chat-history" class="chat-history">
              <div class="chat-item"><strong>System</strong><p>Chat is ready. Ask what you want to build, then click <em>Run Control Room</em>.</p></div>
            </div>
          </div>

          <div class="upload-panel">
            <div class="eyebrow">Context Intake</div>
            <input id="file-input" type="file" multiple style="display:none;" />
            <div class="upload-grid">
              <div class="upload-tile"><strong>ZIP</strong><p class="muted">Import repo or archive.</p></div>
              <div class="upload-tile"><strong>Files & Folder</strong><p class="muted">Attach docs, specs, assets.</p></div>
              <div class="upload-tile"><strong>Images</strong><p class="muted">Screenshots, wireframes, diagrams.</p></div>
              <div class="upload-tile"><strong>Links</strong><p class="muted">GitHub, website, product URL.</p></div>
            </div>
            <div class="link-grid" style="margin-top:12px;">
              <input id="github-link" type="text" value="" placeholder="GitHub repo URL" />
              <input id="website-link" type="text" value="" placeholder="Website or product URL" />
              <input id="product-link" type="text" value="" placeholder="Product URL (optional)" />
            </div>
            <div id="file-list" class="muted" style="margin-top:12px;">No files selected yet.</div>
          </div>
        </section>

        <section class="project-strip">
          <div class="eyebrow">Project Switcher</div>
          <div class="project-tabs">${renderProjectTabs(data)}</div>
        </section>
      </section>

      <section id="workspace-root" class="workspace ${data.onboarding?.ready ? "" : "hero-hidden"}">
        <div class="workspace-grid">
          <div class="stack">
            <section class="panel">
              <h2>Project Context</h2>
              <div class="context-list">
                <div class="context-item"><strong>Project name</strong><p id="context-project-name">${escapeHtml(data.project.name)}</p></div>
                <div class="context-item"><strong>Repo / Path</strong><p id="context-project-path">${escapeHtml(data.selectedProjectDir)}</p></div>
                <div class="context-item"><strong>Detected stack</strong><p id="context-stack">${escapeHtml(data.project.type)}</p></div>
                <div class="context-item"><strong>Current status</strong><p id="context-status">${escapeHtml(data.project.status)}</p></div>
                <div class="context-item"><strong>Workspace phase</strong><p>${escapeHtml(live.current_phase)}</p></div>
                <div class="context-item"><strong>Benchmark pack</strong><p>${escapeHtml(data.project.benchmarkPack)}</p></div>
                <div class="context-item"><strong>Live scope</strong><p>${escapeHtml(data.liveContext.label)}</p></div>
                <div class="context-item"><strong>Attached files</strong><p id="context-files">No files selected yet.</p></div>
              </div>
            </section>

            <section class="panel">
              <h2>Risks & Blockers</h2>
              <div id="risk-list" class="risk-list">
                ${data.risks.length ? data.risks.map((item) => `<div class="risk-item">${escapeHtml(item)}</div>`).join("") : `<div class="risk-item">No major risks recorded yet.</div>`}
              </div>
            </section>

            <section class="panel">
              <h2>Project Summary</h2>
              <ul id="project-summary-list">
                <li>Tasks tracked: ${escapeHtml(data.taskBoard.total)}</li>
                <li>Recent decisions: ${escapeHtml(data.decisions.length)}</li>
                <li>Prompt runs: ${escapeHtml(data.promptLedger.length)}</li>
                <li>QA reviews: ${escapeHtml(data.qaLedger.length)}</li>
              </ul>
            </section>

            <section class="panel">
              <h2>Integrations Panel</h2>
              <div id="integration-root" class="context-list">${renderIntegrations(data.integrations || [])}</div>
            </section>
          </div>

          <section class="panel">
            <h2>Work Board</h2>
            <p class="muted">Jira-style flow from understanding to validation, generated from current project truth.</p>
            <div class="board-wrap">
              <div id="board-root" class="board">${renderBoardColumns(data.boardColumns)}</div>
            </div>
          </section>

          <div class="stack">
            <section class="panel">
              <h2>Activity + Decisions</h2>
              <div id="activity-root" class="feed">${renderActivityFeed(data.activityFeed)}</div>
            </section>

            <section class="panel">
              <h2>Validation Snapshot</h2>
              <ul id="validation-list">
                <li>Critical issues: ${escapeHtml(validation.summary.critical)}</li>
                <li>High issues: ${escapeHtml(validation.summary.high)}</li>
                <li>Medium issues: ${escapeHtml(validation.summary.medium)}</li>
                <li>Verified tasks: ${escapeHtml(validation.summary.verifiedCount)}/${escapeHtml(validation.summary.taskCount)}</li>
                <li>${escapeHtml(validation.benchmark?.applicable ? `Benchmark coverage: ${validation.benchmark.summary.covered}/${validation.benchmark.summary.required}` : "Benchmark coverage: not applicable")}</li>
              </ul>
            </section>

            <section class="panel">
              <h2>NVIDIA Worker Council</h2>
              <div id="council-root" class="context-list">
                <div class="context-item"><strong>Status</strong><p>${escapeHtml(data.council?.latest ? "Last run recorded" : "No council run yet.")}</p></div>
                <div class="context-item"><strong>Accepted / Rejected</strong><p>${escapeHtml(`${data.council?.usage?.acceptedRuns || 0} / ${data.council?.usage?.rejectedRuns || 0}`)}</p></div>
                <div class="context-item"><strong>Estimated tokens</strong><p>${escapeHtml(String(data.council?.usage?.totalEstimatedTokens || 0))}</p></div>
                <div class="context-item"><strong>Estimated cost</strong><p>$${escapeHtml(String(data.council?.usage?.totalEstimatedCostUsd || 0))}</p></div>
              </div>
            </section>
          </div>
        </div>

        <section class="summary-grid">
          <section class="panel">
            <h2>Decision & Output</h2>
            <div id="decision-root" class="decision-list">
              <div class="decision-item"><strong>Final direction</strong><p>${escapeHtml(trace.latest_decision)}</p></div>
              <div class="decision-item"><strong>Next action</strong><p>${escapeHtml(trace.next_action)}</p></div>
              <div class="decision-item"><strong>Why this path</strong><p>${escapeHtml(trace.latest_prompt_critique)}</p></div>
              <div class="decision-item"><strong>QA position</strong><p>${escapeHtml(trace.latest_qa_critique)}</p></div>
            </div>
          </section>

          <section class="panel">
            <h2>Decision Trace</h2>
            <div id="trace-root" class="decision-trace">
              <div class="trace-row"><strong>Observed</strong><p>${escapeHtml(trace.observed.join(" | ") || "No observations recorded.")}</p></div>
              <div class="trace-row"><strong>Checks run</strong><p>${escapeHtml(trace.checks.join(" | ") || "No checks recorded.")}</p></div>
              <div class="trace-row"><strong>Missing proof</strong><p>${escapeHtml(trace.missing_proof.join(" | ") || "No major proof gaps recorded.")}</p></div>
              <div class="trace-row"><strong>Provenance</strong><p>${escapeHtml(trace.provenance.join(" | "))}</p></div>
            </div>
          </section>

          <section class="panel">
            <h2>Decision Log</h2>
            <div id="decision-log-root" class="decision-list">${renderDecisionLog(data.decisionLog || [])}</div>
          </section>
        </section>

        <section class="ledger-grid">
          <section class="panel">
            <h2>Builder Communication</h2>
            <div id="builder-root">${renderPromptCards(data.promptLedger)}</div>
          </section>

          <section class="panel">
            <h2>QA Communication</h2>
            <div id="qa-root">${renderReviewCards(data.qaLedger)}</div>
          </section>
        </section>

        <section class="panel full-width">
          <h2>Project Memory Summary</h2>
          <div id="memory-root" class="context-item"><p>${escapeHtml(data.project.summary)}</p></div>
        </section>

        <section class="panel full-width">
          <h2>MZTEK Team Briefing</h2>
          <div id="briefing-root" class="context-list">
            <div class="context-item"><strong>${escapeHtml(data.teamBriefing?.title || "MZTEK Team Briefing")}</strong><p>${escapeHtml(data.teamBriefing?.goal || "")}</p></div>
            <div class="context-item"><strong>Current state</strong><p>${escapeHtml(data.teamBriefing?.currentState || "")}</p></div>
            <div class="context-item"><strong>Architecture</strong><p>${escapeHtml(data.teamBriefing?.architecture || "")}</p></div>
            <div class="context-item"><strong>Next tasks</strong><p>${escapeHtml((data.teamBriefing?.nextTasks || []).join(" | "))}</p></div>
          </div>
        </section>
      </section>
    </main>

    <div id="github-modal" class="modal" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <div class="eyebrow">GitHub Connection</div>
            <h2>Connect GitHub</h2>
          </div>
          <button id="close-github-modal" type="button" aria-label="Close">×</button>
        </div>
        <p class="muted">MZTEK uses the official GitHub device flow. Paste the repository URL if you want repo-level validation, then approve access in GitHub.</p>
        <div class="field">
          <label for="github-repo-input">Repository URL</label>
          <input id="github-repo-input" type="text" placeholder="https://github.com/owner/repo" />
        </div>
        <div class="action-row">
          <button id="github-connect-submit" class="button" type="button">Start GitHub authorization</button>
          <button id="github-connect-cancel" class="ghost" type="button">Cancel</button>
        </div>
        <div id="github-device-box" class="device-box hero-hidden">
          <strong>Approve in GitHub</strong>
          <p class="muted">Open the official GitHub page, enter the code below, and approve access.</p>
          <div id="github-device-code" class="device-code">-</div>
          <p><a id="github-device-link" href="https://github.com/login/device" target="_blank" rel="noreferrer">Open GitHub authorization</a></p>
          <p id="github-device-status" class="muted">Waiting for GitHub approval.</p>
        </div>
      </div>
    </div>

    <div id="nvidia-modal" class="modal" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <div class="eyebrow">NVIDIA Connection</div>
            <h2>Connect NVIDIA</h2>
          </div>
          <button id="close-nvidia-modal" type="button" aria-label="Close">×</button>
        </div>
        <p class="muted">Paste your NVIDIA API key into the masked field below. MZTEK stores it server-side in encrypted local storage and validates it through <code>/v1/models</code>.</p>
        <div class="field">
          <label for="nvidia-key-input">NVIDIA API key</label>
          <input id="nvidia-key-input" type="password" autocomplete="off" placeholder="Paste NVIDIA API key" />
        </div>
        <div class="field">
          <label for="nvidia-base-url-input">Base URL</label>
          <input id="nvidia-base-url-input" type="text" value="https://integrate.api.nvidia.com/v1" />
        </div>
        <div class="field">
          <label for="nvidia-model-input">Preferred model (optional)</label>
          <input id="nvidia-model-input" type="text" placeholder="Use first validated model if left blank" />
        </div>
        <div class="action-row">
          <button id="nvidia-connect-submit" class="button" type="button">Verify & Connect</button>
          <button id="nvidia-connect-cancel" class="ghost" type="button">Cancel</button>
        </div>
        <p id="nvidia-modal-status" class="muted" style="margin-top:12px;">Connection stays hidden and is never printed back into the UI.</p>
      </div>
    </div>

    <script id="dashboard-seed" type="application/json">${seedJson}</script>
    <script>
      const seed = JSON.parse(document.getElementById("dashboard-seed").textContent);
      const goalInput = document.getElementById("goal-input");
      const githubLink = document.getElementById("github-link");
      const websiteLink = document.getElementById("website-link");
      const productLink = document.getElementById("product-link");
      const fileInput = document.getElementById("file-input");
      const fileList = document.getElementById("file-list");
      const runStatus = document.getElementById("run-status");
      const startButton = document.getElementById("start-btn");
      const analyzeButton = document.getElementById("analyze-btn");
      const loadContextButton = document.getElementById("load-context-btn");
      const startProjectButton = document.getElementById("start-project-btn");
      const connectNvidiaButton = document.getElementById("connect-nvidia-btn");
      const connectGithubButton = document.getElementById("connect-github-btn");
      const workspaceRoot = document.getElementById("workspace-root");
      const chatHistory = document.getElementById("chat-history");
      const chatFeatureBadge = document.getElementById("chat-feature-badge");

      const githubModal = document.getElementById("github-modal");
      const githubRepoInput = document.getElementById("github-repo-input");
      const githubConnectSubmit = document.getElementById("github-connect-submit");
      const githubDeviceBox = document.getElementById("github-device-box");
      const githubDeviceCode = document.getElementById("github-device-code");
      const githubDeviceLink = document.getElementById("github-device-link");
      const githubDeviceStatus = document.getElementById("github-device-status");

      const nvidiaModal = document.getElementById("nvidia-modal");
      const nvidiaKeyInput = document.getElementById("nvidia-key-input");
      const nvidiaBaseUrlInput = document.getElementById("nvidia-base-url-input");
      const nvidiaModelInput = document.getElementById("nvidia-model-input");
      const nvidiaConnectSubmit = document.getElementById("nvidia-connect-submit");

      const nvidiaIntegration = (seed.integrations || []).find((item) => item.key === "nvidia") || {};
      const nvidiaChatEnabled = nvidiaIntegration.chatFeatureEnabled !== false;
      if (!nvidiaChatEnabled) {
        startButton.disabled = true;
        startButton.textContent = "Run Control Room (Disabled)";
        runStatus.textContent = "NVIDIA workforce is experimental and currently disabled.";
        chatFeatureBadge.classList.remove("hero-hidden");
        chatHistory.innerHTML = '<div class="chat-item"><strong>System</strong><p>NVIDIA workforce is experimental and currently disabled. Enable MZTEK_FEATURE_NVIDIA_CHAT=true to turn this on.</p></div>';
      }
      const nvidiaModalStatus = document.getElementById("nvidia-modal-status");

      let githubPollTimer = null;

      function escapeClient(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function tone(value) {
        const normalized = String(value || "").toLowerCase();
        if (["done", "validated", "active", "high", "connected", "pass", "ready"].includes(normalized)) return "tone-good";
        if (["blocked", "failed", "critical", "needs_validation", "not_connected"].includes(normalized)) return "tone-bad";
        if (["partial", "claimed_done", "medium", "queued", "pending"].includes(normalized)) return "tone-warn";
        return "tone-neutral";
      }

      function openModal(modal) {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
      }

      function closeModal(modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      }

      function currentLinks() {
        return {
          github: githubLink.value.trim(),
          website: websiteLink.value.trim(),
          product: productLink.value.trim()
        };
      }

      async function postJson(url, body) {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Request failed.");
        }
        return payload;
      }

      function renderBoard(tasks) {
        const order = ["intake", "understanding", "planning", "building", "reviewing", "validation", "done", "failed"];
        const labels = {
          intake: "Intake",
          understanding: "Understanding",
          planning: "Planning",
          building: "Building",
          reviewing: "Reviewing",
          validation: "Validation",
          done: "Done",
          failed: "Failed"
        };

        const byColumn = Object.fromEntries(order.map((column) => [column, []]));
        for (const task of tasks || []) {
          const key = byColumn[task.column] ? task.column : "planning";
          byColumn[key].push(task);
        }

        document.getElementById("board-root").innerHTML = order.map((column) => {
          const cards = byColumn[column].length ? byColumn[column].map((task) =>
            '<article class="board-card">' +
              '<div class="board-card-head">' +
                '<span class="board-card-id">' + escapeClient(task.id) + '</span>' +
                '<span class="board-chip ' + tone(task.status) + '">' + escapeClient(task.status) + '</span>' +
              '</div>' +
              '<h3>' + escapeClient(task.title) + '</h3>' +
              '<p>' + escapeClient(task.description) + '</p>' +
              '<div class="board-card-meta">' +
                '<span>Proof: ' + escapeClient(task.proof || "pending") + '</span>' +
                '<span>' + escapeClient(task.updatedAt || "") + '</span>' +
              '</div>' +
            '</article>'
          ).join("") : '<div class="board-empty">No items yet.</div>';

          return '<section class="board-column">' +
            '<header class="board-column-head">' +
              '<h3>' + labels[column] + '</h3>' +
              '<span>' + byColumn[column].length + '</span>' +
            '</header>' +
            '<div class="board-column-body">' + cards + '</div>' +
          '</section>';
        }).join("");
      }

      function renderFeed(items) {
        document.getElementById("activity-root").innerHTML = (items && items.length) ? items.map((item) =>
          '<article class="feed-item">' +
            '<div class="feed-marker ' + tone(item.kind) + '"></div>' +
            '<div class="feed-body">' +
              '<strong>' + escapeClient(item.title) + '</strong>' +
              '<p>' + escapeClient(item.detail) + '</p>' +
              '<span>' + escapeClient(item.at || "") + '</span>' +
            '</div>' +
          '</article>'
        ).join("") : '<div class="feed-empty">No activity recorded yet.</div>';
      }

      function renderRiskList(items) {
        document.getElementById("risk-list").innerHTML = (items && items.length)
          ? items.map((item) => '<div class="risk-item">' + escapeClient(item) + '</div>').join("")
          : '<div class="risk-item">No major risks recorded yet.</div>';
      }

      function renderDecisionOutput(result) {
        const decisions = (result.decisions || []).map((item) => typeof item === "string" ? item : item.decision);
        const nextAction = (result.nextActions || [])[0] || "No next action recorded.";
        const why = (result.activity || []).find((item) => item.kind === "decision")?.detail || result.summary;
        const qa = (result.risks || [])[0] || "No QA position recorded.";

        document.getElementById("decision-root").innerHTML =
          '<div class="decision-item"><strong>Final direction</strong><p>' + escapeClient(result.summary || "No summary.") + '</p></div>' +
          '<div class="decision-item"><strong>Next action</strong><p>' + escapeClient(nextAction) + '</p></div>' +
          '<div class="decision-item"><strong>Why this path</strong><p>' + escapeClient(why || "No reasoning summary.") + '</p></div>' +
          '<div class="decision-item"><strong>QA position</strong><p>' + escapeClient(qa) + '</p></div>';

        document.getElementById("trace-root").innerHTML =
          '<div class="trace-row"><strong>Observed</strong><p>' + escapeClient((result.contextSummary || []).join(" | ") || "No observations recorded.") + '</p></div>' +
          '<div class="trace-row"><strong>Checks run</strong><p>' + escapeClient(decisions.join(" | ") || "No checks recorded.") + '</p></div>' +
          '<div class="trace-row"><strong>Missing proof</strong><p>' + escapeClient((result.risks || []).join(" | ") || "No major proof gaps recorded.") + '</p></div>' +
          '<div class="trace-row"><strong>Provenance</strong><p>' + escapeClient("Generated from dashboard submission via " + (result.mode || "provider") + " response.") + '</p></div>';
      }

      function renderSummary(result, fileNames) {
        workspaceRoot.classList.remove("hero-hidden");
        document.getElementById("project-type").textContent = result.projectType || seed.project.type;
        document.getElementById("project-summary").textContent = result.summary || seed.project.summary;
        document.getElementById("memory-root").innerHTML = '<p>' + escapeClient(result.memorySummary || result.summary || seed.project.summary) + '</p>';
        document.getElementById("context-stack").textContent = (result.detectedStack || []).join(", ") || result.projectType || seed.project.type;
        document.getElementById("context-status").textContent = result.currentStatus || "Analysis completed";
        document.getElementById("context-files").textContent = fileNames.length ? fileNames.join(", ") : "No files selected yet.";
        document.getElementById("current-step").textContent = result.currentStep || "Planning";
        document.getElementById("next-action").textContent = result.nextAction || "Review the generated plan.";
        document.getElementById("controller-mode").textContent = result.controllerMode || "controller";
        document.getElementById("project-summary-list").innerHTML = [
          "Tasks tracked: " + ((result.tasks || []).length),
          "Recent decisions: " + ((result.decisions || []).length),
          "Prompt runs: " + seed.promptLedger.length,
          "QA reviews: " + seed.qaLedger.length,
          "Files attached: " + fileNames.length
        ].map((item) => "<li>" + escapeClient(item) + "</li>").join("");
        document.getElementById("onboarding-prompt").textContent = "Project understanding is ready. Continue from the next recommended action.";
        renderPermissionActions(result.requiredInputs || []);
      }

      function renderPermissionActions(items) {
        document.getElementById("permission-root").innerHTML = (items && items.length)
          ? items.map((item) => '<button class="ghost permission-btn" type="button">' + escapeClient(item) + '</button>').join("")
          : '<div class="muted">No pending permission requests.</div>';
      }

      function renderDecisionLog(items) {
        document.getElementById("decision-log-root").innerHTML = (items && items.length)
          ? items.map((item) =>
            '<article class="decision-item">' +
              '<strong>' + escapeClient(item.decision) + '</strong>' +
              '<p><strong>Reason:</strong> ' + escapeClient(item.reason) + '</p>' +
              '<p><strong>Evidence:</strong> ' + escapeClient(item.evidence) + '</p>' +
              '<p><strong>Impact:</strong> ' + escapeClient(item.impact) + '</p>' +
              '<p class="muted">' + escapeClient(item.at || "") + '</p>' +
            '</article>'
          ).join("")
          : '<div class="ledger-empty">No decision log entries yet.</div>';
      }

      function renderIntegrations(items) {
        document.getElementById("integration-root").innerHTML = (items && items.length)
          ? items.map((item) =>
            '<article class="context-item">' +
              '<div class="integration-head">' +
                '<strong>' + escapeClient(item.title) + '</strong>' +
                '<span class="board-chip ' + tone(item.status) + '">' + escapeClient(item.status) + '</span>' +
              '</div>' +
              '<p>' + escapeClient(item.summary || item.detail || "") + '</p>' +
              (item.username ? '<p><strong>User:</strong> ' + escapeClient(item.username) + '</p>' : '') +
              (item.permissionStatus ? '<p><strong>Permission:</strong> ' + escapeClient(item.permissionStatus) + '</p>' : '') +
              (item.model ? '<p><strong>Active model:</strong> ' + escapeClient(item.model) + '</p>' : '') +
              (item.models && item.models.length ? '<p><strong>Models:</strong> ' + escapeClient(item.models.join(", ")) + '</p>' : '') +
              (item.baseUrl ? '<p><strong>Path / URL:</strong> ' + escapeClient(item.baseUrl) + '</p>' : '') +
              (item.warning ? '<p class="muted">' + escapeClient(item.warning) + '</p>' : '') +
            '</article>'
          ).join("")
          : '<div class="ledger-empty">No integrations recorded yet.</div>';
      }

      function renderBriefing(briefing) {
        document.getElementById("briefing-root").innerHTML =
          '<div class="context-item"><strong>' + escapeClient(briefing.title || "MZTEK Team Briefing") + '</strong><p>' + escapeClient(briefing.goal || "") + '</p></div>' +
          '<div class="context-item"><strong>Current state</strong><p>' + escapeClient(briefing.currentState || "") + '</p></div>' +
          '<div class="context-item"><strong>Architecture</strong><p>' + escapeClient(briefing.architecture || "") + '</p></div>' +
          '<div class="context-item"><strong>Risks</strong><p>' + escapeClient((briefing.risks || []).join(" | ") || "No major risks.") + '</p></div>' +
          '<div class="context-item"><strong>Missing integrations</strong><p>' + escapeClient((briefing.missingIntegrations || []).join(" | ") || "None") + '</p></div>' +
          '<div class="context-item"><strong>Next tasks</strong><p>' + escapeClient((briefing.nextTasks || []).join(" | ") || "") + '</p></div>';
      }

      function renderCouncilPanel(council) {
        const usage = council?.usage || {};
        const latest = council?.latest || null;
        const routeList = latest?.routes?.length
          ? latest.routes.map((route) => route.role + " -> " + route.model).join(" | ")
          : "No role assignments yet.";

        document.getElementById("council-root").innerHTML =
          '<div class="context-item"><strong>Status</strong><p>' + escapeClient(latest ? "Last run recorded" : "No council run yet.") + '</p></div>' +
          '<div class="context-item"><strong>Accepted / Rejected</strong><p>' + escapeClient((usage.acceptedRuns || 0) + " / " + (usage.rejectedRuns || 0)) + '</p></div>' +
          '<div class="context-item"><strong>Role routes</strong><p>' + escapeClient(routeList) + '</p></div>' +
          '<div class="context-item"><strong>Estimated tokens</strong><p>' + escapeClient(String(usage.totalEstimatedTokens || 0)) + '</p></div>' +
          '<div class="context-item"><strong>Estimated cost</strong><p>$' + escapeClient(String(usage.totalEstimatedCostUsd || 0)) + '</p></div>';
      }

      function pushChat(role, message) {
        const item = document.createElement("div");
        item.className = "chat-item";
        item.innerHTML = "<strong>" + escapeClient(role) + "</strong><p>" + escapeClient(message) + "</p>";
        chatHistory.appendChild(item);
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }

      async function analyzeProject(mode) {
        const fileNames = [...fileInput.files].map((file) => file.name);
        const payload = await postJson("/api/analyze-project", {
          mode,
          projectDir: seed.selectedProjectDir,
          fileNames,
          links: currentLinks()
        });

        renderSummary(payload.analysis, fileNames);
        renderBoard(payload.analysis.tasks || []);
        renderFeed(payload.analysis.activity || []);
        renderRiskList(payload.analysis.risks || []);
        renderDecisionLog(payload.analysis.decisions || []);
        renderDecisionOutput({
          summary: payload.analysis.summary,
          nextActions: payload.analysis.nextSteps || [],
          activity: payload.analysis.activity || [],
          risks: payload.analysis.risks || [],
          contextSummary: payload.analysis.existingPieces || [],
          decisions: (payload.analysis.decisions || []).map((item) => item.decision),
          mode
        });
        renderIntegrations(payload.integrations || []);
        renderBriefing(payload.analysis.teamBriefing || {});
        document.getElementById("context-project-path").textContent = payload.analysis.projectDir || seed.selectedProjectDir;
        document.getElementById("context-project-name").textContent = payload.analysis.projectName || seed.project.name;
        runStatus.textContent = mode === "start"
          ? "Current project was analyzed and seeded into the Control Room."
          : "Project analysis completed and loaded into the dashboard.";
      }

      async function loadCurrentContext() {
        const projectKey = new URLSearchParams(window.location.search).get("project") || seed.selectedProjectKey;
        const response = await fetch("/api/dashboard?project=" + encodeURIComponent(projectKey));
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load project context.");
        }
        renderBoard(payload.boardColumns.flatMap((column) => column.items.map((item) => ({ ...item, column: column.key }))));
        renderFeed(payload.activityFeed || []);
        renderRiskList(payload.risks || []);
        renderDecisionLog(payload.decisionLog || []);
        renderIntegrations(payload.integrations || []);
        renderPermissionActions(payload.controller?.permissions || []);
        renderBriefing(payload.teamBriefing || {});
        renderCouncilPanel(payload.council || {});
        document.getElementById("project-summary").textContent = payload.project.summary;
        document.getElementById("project-type").textContent = payload.project.type;
        document.getElementById("context-project-name").textContent = payload.project.name;
        document.getElementById("context-project-path").textContent = payload.selectedProjectDir;
        document.getElementById("context-stack").textContent = payload.project.type;
        document.getElementById("context-status").textContent = payload.project.status;
        document.getElementById("memory-root").innerHTML = '<p>' + escapeClient(payload.project.summary) + '</p>';
        document.getElementById("current-step").textContent = payload.controller?.currentStep || "Ready";
        document.getElementById("next-action").textContent = payload.controller?.nextAction || "Review the project.";
        document.getElementById("controller-mode").textContent = payload.controller?.mode || "observer";
        document.getElementById("onboarding-prompt").textContent = payload.onboarding?.prompt || "Do you want MZTEK to analyze this project?";
        if (payload.onboarding?.ready) {
          workspaceRoot.classList.remove("hero-hidden");
        }
      }

      async function beginGitHubConnection() {
        const repoUrl = githubRepoInput.value.trim() || githubLink.value.trim();
        runStatus.textContent = "Starting official GitHub authorization...";
        pushChat("System", "Starting official GitHub authorization.");
        githubDeviceBox.classList.add("hero-hidden");
        const payload = await postJson("/api/github/connect", { repoUrl });
        githubLink.value = repoUrl;
        githubDeviceCode.textContent = payload.deviceFlow.userCode || "-";
        githubDeviceLink.href = payload.deviceFlow.verificationUri || "https://github.com/login/device";
        githubDeviceStatus.textContent = "GitHub approval is pending. Finish approval in the opened page.";
        githubDeviceBox.classList.remove("hero-hidden");
        window.open(githubDeviceLink.href, "_blank", "noopener,noreferrer");
        runStatus.textContent = "GitHub authorization started. Approve access and MZTEK will finish the connection.";
        pushChat("System", "GitHub authorization started. Waiting for approval.");
        pollGitHubAuthorization((payload.deviceFlow.interval || 5) * 1000);
      }

      function pollGitHubAuthorization(intervalMs) {
        if (githubPollTimer) {
          clearTimeout(githubPollTimer);
        }

        const poll = async () => {
          try {
            const payload = await postJson("/api/github/poll", {});
            if (payload.pending) {
              githubDeviceStatus.textContent = payload.message || "Waiting for GitHub approval.";
              githubPollTimer = setTimeout(poll, (payload.interval || intervalMs / 1000 || 5) * 1000);
              return;
            }

            runStatus.textContent = "GitHub connected and validated.";
            pushChat("System", "GitHub connected and validated.");
            githubDeviceStatus.textContent = "GitHub connected successfully.";
            closeModal(githubModal);
            await loadCurrentContext();
          } catch (error) {
            githubDeviceStatus.textContent = error.message;
            runStatus.textContent = error.message;
          }
        };

        githubPollTimer = setTimeout(poll, intervalMs);
      }

      async function connectNvidia() {
        const apiKey = nvidiaKeyInput.value.trim();
        if (!apiKey) {
          throw new Error("Paste your NVIDIA API key first.");
        }

        nvidiaModalStatus.textContent = "Validating NVIDIA key against /v1/models...";
        pushChat("System", "Validating NVIDIA connection with /v1/models.");
        const payload = await postJson("/api/nvidia/validate", {
          apiKey,
          baseUrl: nvidiaBaseUrlInput.value.trim(),
          selectedModel: nvidiaModelInput.value.trim()
        });
        nvidiaKeyInput.value = "";
        nvidiaModalStatus.textContent = payload.message || "NVIDIA connection validated.";
        runStatus.textContent = payload.message || "NVIDIA connection validated.";
        pushChat("System", payload.message || "NVIDIA connection validated.");
        closeModal(nvidiaModal);
        await loadCurrentContext();
      }

      fileInput.addEventListener("change", () => {
        const names = [...fileInput.files].map((file) => file.name);
        fileList.textContent = names.length ? names.join(", ") : "No files selected yet.";
        document.getElementById("context-files").textContent = names.length ? names.join(", ") : "No files selected yet.";
      });

      startButton.addEventListener("click", async () => {
        if (!nvidiaChatEnabled) {
          runStatus.textContent = "NVIDIA workforce is experimental and currently disabled.";
          pushChat("System", "NVIDIA workforce is experimental and currently disabled.");
          return;
        }

        const message = goalInput.value.trim();
        const fileNames = [...fileInput.files].map((file) => file.name);
        const links = currentLinks();

        if (!message) {
          runStatus.textContent = "Add a build goal first so the Control Room has something to work from.";
          return;
        }

        startButton.disabled = true;
        runStatus.textContent = "MZTEK is generating work items, activity, decisions, and risks...";
        pushChat("You", message);

        try {
          const response = await fetch("/api/nvidia-chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message, fileNames, links })
          });

          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.error || "Failed to generate dashboard response.");
          }

          const result = payload.result;
          if (result.modelUsage?.selectedModel) {
            result.activity = [
              {
                kind: "system",
                title: "NVIDIA model used",
                detail: result.modelUsage.selectedModel,
                at: new Date().toISOString()
              },
              ...(result.activity || [])
            ];
          }
          renderSummary(result, fileNames);
          renderBoard(result.tasks || []);
          renderFeed(result.activity || []);
          renderRiskList(result.risks || []);
          renderDecisionOutput(result);
          renderDecisionLog(result.decisions || []);
          await loadCurrentContext();
          runStatus.textContent = "Control Room updated using " + payload.provider + " mode.";
          pushChat("MZTEK", result.summary || "Council run completed.");
        } catch (error) {
          runStatus.textContent = error.message;
          pushChat("System", error.message);
        } finally {
          startButton.disabled = false;
        }
      });

      analyzeButton.addEventListener("click", async () => {
        analyzeButton.disabled = true;
        runStatus.textContent = "Analyzing current project structure and risks...";
        try {
          await analyzeProject("analyze");
        } catch (error) {
          runStatus.textContent = error.message;
        } finally {
          analyzeButton.disabled = false;
        }
      });

      startProjectButton.addEventListener("click", async () => {
        startProjectButton.disabled = true;
        runStatus.textContent = "Starting from the current project and generating initial work items...";
        try {
          await analyzeProject("start");
        } catch (error) {
          runStatus.textContent = error.message;
        } finally {
          startProjectButton.disabled = false;
        }
      });

      loadContextButton.addEventListener("click", async () => {
        loadContextButton.disabled = true;
        runStatus.textContent = "Reloading current MZTEK project context...";
        try {
          await loadCurrentContext();
          runStatus.textContent = "Project context reloaded from the current controlled workspace.";
        } catch (error) {
          runStatus.textContent = error.message;
        } finally {
          loadContextButton.disabled = false;
        }
      });

      connectGithubButton.addEventListener("click", () => {
        githubRepoInput.value = githubLink.value.trim();
        githubDeviceBox.classList.add("hero-hidden");
        githubDeviceStatus.textContent = "Waiting for GitHub approval.";
        openModal(githubModal);
      });

      connectNvidiaButton.addEventListener("click", () => {
        nvidiaKeyInput.value = "";
        nvidiaModalStatus.textContent = "Connection stays hidden and is never printed back into the UI.";
        openModal(nvidiaModal);
      });

      githubConnectSubmit.addEventListener("click", async () => {
        githubConnectSubmit.disabled = true;
        try {
          await beginGitHubConnection();
        } catch (error) {
          githubDeviceStatus.textContent = error.message;
          githubDeviceBox.classList.remove("hero-hidden");
          runStatus.textContent = error.message;
        } finally {
          githubConnectSubmit.disabled = false;
        }
      });

      nvidiaConnectSubmit.addEventListener("click", async () => {
        nvidiaConnectSubmit.disabled = true;
        try {
          await connectNvidia();
        } catch (error) {
          nvidiaModalStatus.textContent = error.message;
          runStatus.textContent = error.message;
        } finally {
          nvidiaConnectSubmit.disabled = false;
        }
      });

      document.getElementById("close-github-modal").addEventListener("click", () => closeModal(githubModal));
      document.getElementById("github-connect-cancel").addEventListener("click", () => closeModal(githubModal));
      document.getElementById("close-nvidia-modal").addEventListener("click", () => closeModal(nvidiaModal));
      document.getElementById("nvidia-connect-cancel").addEventListener("click", () => closeModal(nvidiaModal));
    </script>
  </body>
</html>`;
}
