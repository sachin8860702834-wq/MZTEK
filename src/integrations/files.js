import fs from "node:fs";
import path from "node:path";

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function topEntries(projectDir) {
  try {
    return fs
      .readdirSync(projectDir, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith(".git"))
      .slice(0, 24);
  } catch {
    return [];
  }
}

function detectStack(projectDir, entries) {
  const names = new Set(entries.map((entry) => entry.name.toLowerCase()));
  const packageJson = names.has("package.json") ? safeReadJson(path.join(projectDir, "package.json")) : null;
  const technologies = [];

  if (packageJson) {
    technologies.push("Node.js");
    if (packageJson.type === "module") {
      technologies.push("ESM");
    }

    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    if (deps.react) {
      technologies.push("React");
    }
    if (deps.next) {
      technologies.push("Next.js");
    }
    if (deps.express) {
      technologies.push("Express");
    }
    if (deps.typescript) {
      technologies.push("TypeScript");
    }
  }

  if (names.has("requirements.txt") || names.has("pyproject.toml")) {
    technologies.push("Python");
  }
  if (names.has("dockerfile")) {
    technologies.push("Docker");
  }
  if (names.has("README.md".toLowerCase())) {
    technologies.push("Documented workspace");
  }

  return technologies.length ? technologies : ["Unclassified software workspace"];
}

function buildMissingPieces(entries, stack) {
  const names = new Set(entries.map((entry) => entry.name.toLowerCase()));
  const missing = [];

  if (!names.has("readme.md")) {
    missing.push("High-signal README or project brief");
  }
  if (!names.has("tests")) {
    missing.push("Dedicated tests folder or visible validation surface");
  }
  if (!names.has("docs")) {
    missing.push("Architecture or product docs folder");
  }
  if (stack.includes("Node.js") && !names.has("package.json")) {
    missing.push("package.json for Node-based workflow");
  }

  return missing;
}

function buildRisks(entries, stack, fileNames) {
  const names = new Set(entries.map((entry) => entry.name.toLowerCase()));
  const risks = [];

  if (!fileNames.length) {
    risks.push("No extra files were attached to help the first analysis pass.");
  }
  if (!names.has(".mztek")) {
    risks.push("No governed .mztek project state is present in this workspace.");
  }
  if (!names.has("tests")) {
    risks.push("No obvious tests directory was found, so validation coverage may be weak.");
  }
  if (stack.includes("Unclassified software workspace")) {
    risks.push("The stack could not be detected cleanly from the current top-level files.");
  }

  return risks;
}

function buildNextSteps(missingPieces, stack) {
  const next = [
    "Confirm the core product goal and current scope before more implementation expands.",
    "Use the work board to split understanding, planning, building, review, and validation."
  ];

  if (missingPieces.length) {
    next.push(`Create or attach the missing project signals: ${missingPieces.slice(0, 2).join(", ")}.`);
  }
  if (stack.includes("Node.js")) {
    next.push("Verify package scripts and startup flow so the dashboard stays the main operating surface.");
  }

  return next.slice(0, 5);
}

function buildRequiredInputs({ links, missingPieces }) {
  const required = [];

  if (!links.github) {
    required.push("Connect GitHub or paste a repository URL.");
  }
  if (!links.website && !links.product) {
    required.push("Add a website or product URL if you want outside context included.");
  }
  if (missingPieces.length) {
    required.push("Review the missing project signals before approving the next plan.");
  }

  return required.slice(0, 4);
}

function buildDecisionLog(projectDir, stack, missingPieces, risks) {
  const timestamp = new Date().toISOString();
  const decisions = [
    {
      decision: "Use dashboard-first project control.",
      reason: "The product goal is to reduce dependence on scattered chat and CLI workflows.",
      evidence: `Workspace analyzed at ${projectDir}.`,
      impact: "Future actions should be available from the Control Room instead of direct CLI use.",
      at: timestamp
    },
    {
      decision: `Treat this as ${stack[0]}.`,
      reason: "Detected stack influences the first work breakdown and validation path.",
      evidence: `Detected technologies: ${stack.join(", ")}.`,
      impact: "The work board and next actions can be aligned with the actual workspace shape.",
      at: timestamp
    }
  ];

  if (missingPieces.length) {
    decisions.push({
      decision: "Prioritize missing project signals before expansion.",
      reason: "Weak project context makes later execution and validation less reliable.",
      evidence: `Missing pieces: ${missingPieces.join(", ")}.`,
      impact: "The next steps focus on context completion and risk reduction first.",
      at: timestamp
    });
  }

  if (risks.length) {
    decisions.push({
      decision: "Keep current implementation claims provisional.",
      reason: "The first pass still shows workspace risks and limited proof.",
      evidence: risks.join(" | "),
      impact: "The dashboard should present findings as guidance, not as validated completion.",
      at: timestamp
    });
  }

  return decisions;
}

function buildTasks(projectName, nextSteps) {
  const timestamp = new Date().toISOString();
  return [
    {
      id: "TASK-I1",
      title: "Capture project intake",
      description: `Store ${projectName} goal, links, and files as the current control-room input.`,
      status: "active",
      column: "intake",
      proof: "intake captured",
      updatedAt: timestamp
    },
    {
      id: "TASK-U1",
      title: "Analyze current project structure",
      description: "Inspect top-level files, stack signals, and governed state to understand what exists.",
      status: "active",
      column: "understanding",
      proof: "structure analyzed",
      updatedAt: timestamp
    },
    {
      id: "TASK-P1",
      title: "Plan the next build loop",
      description: nextSteps[0] || "Create the next high-signal work breakdown.",
      status: "ready",
      column: "planning",
      proof: "initial roadmap",
      updatedAt: timestamp
    },
    {
      id: "TASK-R1",
      title: "Review project risks",
      description: "Keep risk review visible before new work moves into implementation.",
      status: "queued",
      column: "reviewing",
      proof: "risk list",
      updatedAt: timestamp
    },
    {
      id: "TASK-V1",
      title: "Define validation expectations",
      description: "Record what proof is required before future claims are accepted.",
      status: "queued",
      column: "validation",
      proof: "validation path pending",
      updatedAt: timestamp
    }
  ];
}

function buildActivity(projectName, nextSteps, risks) {
  const timestamp = new Date().toISOString();
  return [
    {
      kind: "system",
      title: "System analyzed project",
      detail: `${projectName} was inspected to understand the current stack and project shape.`,
      at: timestamp
    },
    {
      kind: "planning",
      title: "Planning created work items",
      detail: "Initial intake, understanding, planning, review, and validation tasks were generated.",
      at: timestamp
    },
    {
      kind: "decision",
      title: "Decision made",
      detail: nextSteps[0] || "Prioritize understanding before expanding implementation.",
      at: timestamp
    },
    {
      kind: "review",
      title: "Risk found",
      detail: risks[0] || "No major blockers were detected in the first pass.",
      at: timestamp
    }
  ];
}

function buildTeamBriefing({ projectName, projectDir, stack, risks, missingPieces, nextSteps }) {
  return {
    title: "MZTEK Team Briefing",
    goal: `Understand and move ${projectName} forward from the dashboard without depending on direct CLI flow.`,
    currentState: `Workspace: ${projectDir}. Stack: ${stack.join(", ")}.`,
    architecture: `Current analysis sees ${stack[0]} as the primary shape. Future work should stay dashboard-first and validation-aware.`,
    risks: risks.length ? risks : ["No major risks were detected in the first pass."],
    missingIntegrations: [
      "Live GitHub automation is not connected yet.",
      "NVIDIA remains in mock mode until credentials are configured."
    ],
    nextTasks: nextSteps
  };
}

export function summarizeFileUploads(fileNames = []) {
  if (!fileNames.length) {
    return {
      status: "empty",
      summary: "No uploaded files attached yet."
    };
  }

  return {
    status: "ready",
    summary: `${fileNames.length} attached file${fileNames.length === 1 ? "" : "s"}: ${fileNames.join(", ")}`
  };
}

export function analyzeProjectContext({ projectDir, fileNames = [], links = {} }) {
  const entries = topEntries(projectDir);
  const stack = detectStack(projectDir, entries);
  const missingPieces = buildMissingPieces(entries, stack);
  const risks = buildRisks(entries, stack, fileNames);
  const nextSteps = buildNextSteps(missingPieces, stack);
  const requiredInputs = buildRequiredInputs({ links, missingPieces });
  const projectName = path.basename(projectDir);
  const entryNames = entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name));
  const memorySummary = [
    `Workspace path: ${projectDir}`,
    `Top-level structure: ${entryNames.slice(0, 10).join(", ") || "No visible files."}`,
    `Detected stack: ${stack.join(", ")}.`,
    missingPieces.length ? `Missing pieces: ${missingPieces.join(", ")}.` : "No major missing project signals were detected in the first pass.",
    Object.values(links).filter(Boolean).length ? "External links are attached for added grounding." : "No external links were attached."
  ].join(" ");

  return {
    projectName,
    projectDir,
    detectedStack: stack,
    currentStatus: entries.length ? "Project structure detected" : "Workspace appears sparse",
    currentStep: requiredInputs.length ? "Waiting for input" : "Planning",
    nextAction: requiredInputs[0] || nextSteps[0] || "Review the generated plan.",
    controllerMode: requiredInputs.length ? "observer" : "controller",
    requiredInputs,
    topEntries: entryNames.slice(0, 12),
    existingPieces: entryNames.slice(0, 12),
    missingPieces,
    risks,
    nextSteps,
    memorySummary,
    summary: `${projectName} looks like a ${stack[0].toLowerCase()} with ${entryNames.length || 0} visible top-level signals.`,
    tasks: buildTasks(projectName, nextSteps),
    activity: buildActivity(projectName, nextSteps, risks),
    decisions: buildDecisionLog(projectDir, stack, missingPieces, risks),
    teamBriefing: buildTeamBriefing({
      projectName,
      projectDir,
      stack,
      risks,
      missingPieces,
      nextSteps
    })
  };
}
