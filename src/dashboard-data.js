import { loadProjectState, projectExists } from "./fs-store.js";
import { loadLiveStatus } from "./live-tracker.js";
import { latestPromptRuns } from "./prompt-ledger.js";
import { latestQaReviews } from "./review-ledger.js";
import { validateProject } from "./validator.js";
import { summarizeGitHubIntegration } from "./integrations/github.js";
import { getNvidiaStatus } from "./integrations/nvidia.js";
import { summarizeFileUploads } from "./integrations/files.js";
import { latestCouncilRuns, summarizeCouncilUsage } from "./council/ledger.js";

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function summarizeTaskBuckets(tasks) {
  const buckets = new Map();

  for (const task of tasks) {
    const key = task.status || "unknown";
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return [...buckets.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([status, count]) => ({
      status,
      label: titleCase(status),
      count
    }));
}

function summarizeProjectType(state) {
  if (state.project.sampleProject === "career-mantra") {
    return "AI-assisted job search operating system";
  }

  if (state.project.benchmarkPack !== "none" && state.project.benchmarkPack) {
    return "Governed product workspace";
  }

  return "Product control workspace";
}

function buildRiskSummary(liveStatus, validation) {
  const issues = validation.run.issues.slice(0, 4).map((issue) => issue.message);
  const blockers = liveStatus.blockers || [];
  return [...blockers, ...issues].slice(0, 6);
}

function buildBoardColumns(state, liveStatus, validation, projectName) {
  const columns = {
    intake: [],
    understanding: [],
    planning: [],
    building: [],
    reviewing: [],
    validation: [],
    done: [],
    failed: []
  };

  columns.intake.push({
    id: "INTAKE-001",
    title: `${projectName} intake`,
    description: "Current project goal, links, files, and integration readiness.",
    status: "active",
    proof: "dashboard context",
    updatedAt: state.project.updatedAt || state.project.createdAt
  });

  columns.understanding.push({
    id: "GOAL-001",
    title: projectName,
    description: liveStatus.current_task,
    status: "active",
    proof: validation.score,
    updatedAt: state.project.updatedAt || state.project.createdAt
  });

  for (const task of state.tasks.items) {
    const card = {
      id: task.id,
      title: task.title,
      description: task.notes || `${task.kind || "general"} task`,
      status: task.status,
      proof: task.evidence?.length || 0,
      updatedAt: task.updatedAt || task.createdAt
    };

    if (task.status === "done") {
      columns.done.push(card);
    } else if (task.status === "blocked") {
      columns.failed.push(card);
    } else if (task.status === "needs_validation" || task.status === "claimed_done") {
      columns.validation.push(card);
    } else if (task.kind === "planning") {
      columns.planning.push(card);
    } else if (task.kind === "feature" || task.kind === "workflow" || task.kind === "security") {
      columns.building.push(card);
    } else {
      columns.reviewing.push(card);
    }
  }

  for (const review of latestQaReviews(state, 4).reverse()) {
    columns.reviewing.push({
      id: review.id,
      title: `${review.taskId} QA review`,
      description: review.critique || "QA review recorded.",
      status: review.severity,
      proof: review.severity,
      updatedAt: review.createdAt
    });
  }

  for (const prompt of latestPromptRuns(state, 4).reverse()) {
    columns.validation.push({
      id: prompt.id,
      title: `${prompt.taskId} prompt run`,
      description: prompt.responseSummary || prompt.expectedOutcome || "Prompt run recorded.",
      status: prompt.outcome,
      proof: prompt.evidenceQuality,
      updatedAt: prompt.createdAt
    });
  }

  return [
    { key: "intake", title: "Intake", items: columns.intake },
    { key: "understanding", title: "Understanding", items: columns.understanding },
    { key: "planning", title: "Planning", items: columns.planning },
    { key: "building", title: "Building", items: columns.building },
    { key: "reviewing", title: "Reviewing", items: columns.reviewing },
    { key: "validation", title: "Validation", items: columns.validation },
    { key: "done", title: "Done", items: columns.done },
    { key: "failed", title: "Failed", items: columns.failed }
  ];
}

function buildActivityFeed(state, liveStatus) {
  const entries = [];

  for (const item of state.decisions.items.slice(-4)) {
    entries.push({
      kind: "decision",
      title: "Decision recorded",
      detail: item.summary,
      at: item.addedAt
    });
  }

  for (const item of latestPromptRuns(state, 4)) {
    entries.push({
      kind: "prompt",
      title: `${item.target} prompt run`,
      detail: item.critique || item.responseSummary || item.expectedOutcome,
      at: item.createdAt
    });
  }

  for (const item of latestQaReviews(state, 4)) {
    entries.push({
      kind: "review",
      title: `${item.reviewer} review`,
      detail: item.critique || item.recommendedAction || "QA review recorded.",
      at: item.createdAt
    });
  }

  for (const item of liveStatus.latest_capability_gains?.slice(0, 4) || []) {
    entries.push({
      kind: "system",
      title: "System progress",
      detail: item,
      at: liveStatus.updated_at
    });
  }

  return entries
    .filter((item) => item.detail)
    .sort((left, right) => String(right.at).localeCompare(String(left.at)))
    .slice(0, 10);
}

function buildDecisionLog(state, validation) {
  const issues = validation.run.issues.slice(0, 3);
  const items = state.decisions.items.slice(-6).reverse().map((item) => ({
    decision: item.summary,
    reason: item.rationale || "No rationale recorded.",
    evidence: issues[0]?.message || "Decision ledger entry.",
    impact: "Keeps current project direction visible in the dashboard.",
    at: item.addedAt
  }));

  if (items.length) {
    return items;
  }

  return [
    {
      decision: "Keep MZTEK as the default dashboard project.",
      reason: "The Control Room should open on the main product workspace by default.",
      evidence: "Dashboard default-project rule.",
      impact: "Sample projects remain available without hijacking the main workspace view.",
      at: new Date().toISOString()
    }
  ];
}

function buildIntegrations(projectDir, workspaceRoot, env) {
  const rootDir = workspaceRoot || projectDir;
  const github = summarizeGitHubIntegration(rootDir);
  const nvidia = getNvidiaStatus(rootDir, env);

  return [
    {
      key: "nvidia",
      title: "NVIDIA NIM",
      summary: nvidia.status === "connected"
        ? (nvidia.chatFeatureEnabled
          ? "Connected through the dashboard and validated through the official API."
          : "Connected, but workforce chat is currently feature-gated.")
        : "Use the dashboard to connect NVIDIA securely and validate it before live use.",
      detail: `${nvidia.mode?.toUpperCase() || "NVIDIA"} mode${nvidia.model ? ` | ${nvidia.model}` : ""}${nvidia.chatFeatureEnabled ? "" : " | Experimental (Disabled)"}`,
      ...nvidia
    },
    {
      key: "github",
      title: "GitHub",
      ...github
    },
    {
      key: "local-project",
      title: "Local project",
      status: "ready",
      mode: "local",
      baseUrl: projectDir,
      model: "",
      summary: `Using ${projectDir} as the controlled project path.`,
      warning: ""
    },
    {
      key: "files",
      title: "File uploads",
      mode: "local",
      baseUrl: "",
      model: "",
      ...summarizeFileUploads([])
    },
    {
      key: "mock-provider",
      title: "Mock provider",
      status: "ready",
      mode: "mock",
      baseUrl: "",
      model: "",
      summary: "Mock planning stays available when live provider credentials are missing.",
      warning: ""
    },
    {
      key: "future-providers",
      title: "Future providers",
      status: "planned",
      mode: "planned",
      baseUrl: "",
      model: "",
      summary: "The provider abstraction is ready for more OpenAI-compatible and local providers later.",
      warning: ""
    }
  ];
}

function buildControllerState(project, integrations, risks, liveStatus) {
  const missingNvidia = integrations.find((item) => item.key === "nvidia")?.status !== "connected";
  const missingGithub = integrations.find((item) => item.key === "github")?.status !== "connected";
  const blocker = risks[0] || liveStatus.blockers?.[0] || "";
  const currentStep = missingGithub ? "Waiting for input" : project.phase === "planning" ? "Planning" : "Working";
  const nextAction = missingGithub
    ? "Connect GitHub through the official authorization flow."
    : missingNvidia
      ? "Connect NVIDIA through the dashboard and validate the API key."
      : project.summary
        ? "Review the current project understanding and approve the next plan."
        : "Start from the current project to generate the first understanding report.";

  const permissions = [];
  if (missingGithub) {
    permissions.push("Connect GitHub?");
  }
  if (missingNvidia) {
    permissions.push("Connect NVIDIA?");
  }
  if (!project.summary) {
    permissions.push("Approve first project analysis?");
  }

  return {
    mode: permissions.length ? "observer" : "controller",
    currentStep,
    nextAction,
    blocker,
    permissions
  };
}

function buildDecisionTrace(state, status, validation) {
  const latestRun = validation.run;
  const criticalIssues = latestRun.issues.filter((issue) => issue.severity === "critical");
  const highIssues = latestRun.issues.filter((issue) => issue.severity === "high");
  const latestDecision = state.decisions.items[state.decisions.items.length - 1] || null;
  const latestPrompt = latestPromptRuns(state, 1)[0] || null;
  const latestReview = latestQaReviews(state, 1)[0] || null;

  const signals = [];
  const checks = [];
  const missingProof = [];
  const provenance = [];

  if (status.current_focus?.length) {
    for (const item of status.current_focus) {
      signals.push(item);
    }
    provenance.push("Observed signals are derived from workspace live status.");
  }

  if (latestRun.benchmark?.applicable) {
    checks.push(
      `Benchmark coverage ${latestRun.benchmark.summary.covered}/${latestRun.benchmark.summary.required}`
    );
  }

  checks.push(`Validation score ${validation.score}`);
  checks.push(`Critical issues ${latestRun.summary.critical}`);
  checks.push(`High issues ${latestRun.summary.high}`);

  for (const issue of criticalIssues.slice(0, 3)) {
    missingProof.push(issue.message);
  }

  if (missingProof.length === 0) {
    for (const issue of highIssues.slice(0, 3)) {
      missingProof.push(issue.message);
    }
  }

  const principles = [
    ...(state.project.principles || []),
    "MZTEK shows the basis for decisions through structured traces, not blind trust."
  ];
  provenance.push("Project principles are recorded project inputs.");
  provenance.push("Rejected assumptions are current MZTEK governance defaults.");
  provenance.push("Latest prompt critique is recorded only when a prompt ledger entry exists.");
  provenance.push("Latest QA critique is recorded only when a QA review entry exists.");

  return {
    goal: status.current_task,
    observed: signals,
    principles,
    checks,
    assumptions_rejected: [
      "A claimed completion is not accepted without evidence.",
      "IDE output is treated as untrusted until validation passes.",
      "One fix path should not inherit proof for adjacent concerns."
    ],
    latest_decision: latestDecision
      ? `${latestDecision.summary}${latestDecision.rationale ? ` - ${latestDecision.rationale}` : ""}`
      : "No explicit decision recorded yet.",
    latest_prompt_critique: latestPrompt?.critique || "No prompt critique recorded yet.",
    latest_qa_critique: latestReview?.critique || "No QA critique recorded yet.",
    missing_proof: missingProof,
    next_action: status.pending_next?.[0] || "No next action recorded yet.",
    provenance
  };
}

export function buildDashboardData(projectDir, workspaceRoot, env = process.env) {
  const state = loadProjectState(projectDir);
  const liveStatus = loadLiveStatus(workspaceRoot);
  const validation = validateProject(state);
  const projectScoped = projectDir === workspaceRoot;
  const projectName = projectScoped ? liveStatus.project || state.project.name : state.project.name;
  const projectSummary =
    state.project.summary ||
    (projectScoped
      ? "Control workspace for MZTEK planning, validation, prompt governance, and dashboard evolution."
      : "No project summary yet.");

  const availableProjects = [];
  if (projectExists(workspaceRoot)) {
    availableProjects.push({
      key: "mztek",
      label: liveStatus.project || "MZTEK",
      projectDir: workspaceRoot
    });
  }

  const careerMantraDir = `${workspaceRoot}\\sandboxes\\career-mantra`;
  if (projectExists(careerMantraDir)) {
    availableProjects.push({
      key: "career-mantra",
      label: "Career Mantra",
      projectDir: careerMantraDir
    });
  }

  const latestRun = validation.run;
  const latestValidation = {
    score: validation.score,
    ok: validation.ok,
    summary: latestRun.summary,
    benchmark: latestRun.benchmark || null,
    topIssues: latestRun.issues.slice(0, 6)
  };
  const integrations = buildIntegrations(projectDir, workspaceRoot, env);
  const councilRuns = latestCouncilRuns(workspaceRoot, 8);
  const councilUsage = summarizeCouncilUsage(workspaceRoot);
  const latestCouncil = councilRuns[0] || null;
  const controller = buildControllerState({
    phase: state.project.currentPhase,
    summary: projectSummary
  }, integrations, buildRiskSummary(liveStatus, validation), liveStatus);

  return {
    generatedAt: new Date().toISOString(),
    selectedProjectDir: projectDir,
    selectedProjectKey: availableProjects.find((item) => item.projectDir === projectDir)?.key || "custom",
    availableProjects,
    project: {
      name: projectName,
      summary: projectSummary,
      phase: state.project.currentPhase,
      status: state.project.status,
      benchmarkPack: state.project.benchmarkPack || "none",
      sampleProject: state.project.sampleProject || "none",
      updatedAt: state.project.updatedAt || state.project.createdAt,
      type: summarizeProjectType(state)
    },
    workspaceLive: liveStatus,
    liveContext: {
      projectScoped,
      label: projectScoped
        ? "Workspace live status is scoped to this project."
        : "Workspace live status is global to the MZTEK workspace, not this specific project."
    },
    taskBoard: {
      total: state.tasks.items.length,
      buckets: summarizeTaskBuckets(state.tasks.items),
      tasks: state.tasks.items
    },
    decisions: state.decisions.items.slice().reverse().slice(0, 8),
    decisionLog: buildDecisionLog(state, validation),
    promptLedger: latestPromptRuns(state, 8),
    qaLedger: latestQaReviews(state, 8),
    boardColumns: buildBoardColumns(state, liveStatus, validation, projectName),
    activityFeed: buildActivityFeed(state, liveStatus),
    integrations,
    council: {
      latest: latestCouncil,
      recentRuns: councilRuns,
      usage: councilUsage
    },
    risks: buildRiskSummary(liveStatus, validation),
    controller,
    onboarding: {
      prompt: `Do you want MZTEK to analyze ${projectName}?`,
      ready: Boolean(projectSummary),
      firstAction: controller.nextAction
    },
    teamBriefing: {
      title: "MZTEK Team Briefing",
      goal: `Understand and move ${projectName} forward from the dashboard.`,
      currentState: projectSummary,
      architecture: `Current project type: ${summarizeProjectType(state)}.`,
      risks: buildRiskSummary(liveStatus, validation),
      missingIntegrations: integrations.filter((item) => item.status !== "ready").map((item) => item.title),
      nextTasks: [controller.nextAction, ...(liveStatus.pending_next || []).slice(0, 2)]
    },
    latestValidation,
    benchmarkSuggestions: latestRun.benchmark?.suggestions?.slice(0, 6) || [],
    sampleContext: state.sampleContext || null,
    decisionTrace: buildDecisionTrace(state, liveStatus, validation)
  };
}
