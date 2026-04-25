#!/usr/bin/env node
import { initProject, projectExists, saveProjectState, loadProjectState } from "./fs-store.js";
import { createTask, claimTaskDone, addEvidence, addDecision } from "./tasks.js";
import { validateProject } from "./validator.js";
import { formatStatus, formatValidation, formatFixtureEvaluation, formatProjectReport, formatPromptLedger, formatQaLedger } from "./report.js";
import { evaluateFixture, loadFixture } from "./fixture-evaluator.js";
import { availableSamples, seedFromSample, workspaceRootFromModule } from "./sample-loader.js";
import { formatLiveStatus, formatPulse, loadLiveStatus } from "./live-tracker.js";
import { startApiServer } from "./mztek-api.js";
import { startDashboardServer } from "./dashboard-server.js";
import { latestPromptRuns, recordPromptRun } from "./prompt-ledger.js";
import { latestQaReviews, recordQaReview } from "./review-ledger.js";

function parseArgs(argv) {
  const args = {};

  for (const token of argv) {
    if (token.startsWith("--")) {
      const [key, rawValue = "true"] = token.slice(2).split("=");
      args[key] = rawValue;
    }
  }

  return args;
}

function csv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function projectDirFromArgs(args) {
  return args.project ? args.project : process.cwd();
}

function dashboardProjectDir(args, workspaceRoot) {
  if (args.project) {
    return args.project;
  }

  if (projectExists(workspaceRoot)) {
    return workspaceRoot;
  }

  const sampleSandbox = `${workspaceRoot}\\sandboxes\\career-mantra`;
  if (projectExists(sampleSandbox)) {
    return sampleSandbox;
  }

  return process.cwd();
}

function help() {
  return [
    "MZTEK CLI",
    "",
    "Commands:",
    "  mztek init --name=ProjectName",
    "  mztek status [--project=PATH]",
    "  mztek report [--project=PATH]",
    "  mztek live-status",
    "  mztek pulse",
    "  mztek serve-api [--port=4317]",
    "  mztek dashboard [--project=PATH] [--port=4321]",
    "  mztek prompt-history [--project=PATH]",
    "  mztek review-history [--project=PATH]",
    "  mztek record-prompt --task=TASK-001 --intent=... --prompt=... --target=... --expected=... [--response=...] [--outcome=partial] [--evidence-quality=weak] [--critique=...] [--next=...] [--project=PATH]",
    "  mztek record-review --prompt=PROMPT-001 --task=TASK-001 [--reviewer=qa-sidecar] [--severity=high] [--class=constraint_drift] [--critique=...] [--evidence-gap=...] [--next=...] [--source=manual] [--project=PATH]",
    "  mztek add-task --title=... [--owner=...] [--depends-on=TASK-001,TASK-002] [--required-evidence=test,review] [--project=PATH]",
    "  mztek claim-done --task=TASK-001 [--note=...] [--project=PATH]",
    "  mztek add-evidence --task=TASK-001 --type=test --detail='npm test passed' [--project=PATH]",
    "  mztek add-decision --summary=... [--rationale=...] [--project=PATH]",
    "  mztek validate [--project=PATH]",
    "  mztek evaluate-fixture --file=./tests/fixtures/example.json",
    "  mztek list-samples",
    "  mztek seed-sample --sample=career-mantra [--target=./sandbox]"
  ].join("\n");
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const workspaceRoot = workspaceRootFromModule();

  if (!command || command === "help" || command === "--help") {
    console.log(help());
    return;
  }

  if (command === "init") {
    if (projectExists(process.cwd())) {
      console.log("MZTEK project already initialized.");
      return;
    }

    initProject(process.cwd(), args.name);
    console.log(`Initialized MZTEK project in ${process.cwd()}`);
    return;
  }

  if (command === "evaluate-fixture") {
    if (!args.file) {
      throw new Error("--file is required");
    }

    const fixture = loadFixture(args.file);
    const result = evaluateFixture(fixture);
    console.log(formatFixtureEvaluation(result));
    process.exitCode = result.status === "validated" ? 0 : 1;
    return;
  }

  if (command === "list-samples") {
    const samples = availableSamples(workspaceRoot);
    if (samples.length === 0) {
      console.log("No samples available.");
      return;
    }
    console.log(samples.join("\n"));
    return;
  }

  if (command === "live-status") {
    const status = loadLiveStatus(workspaceRoot);
    console.log(formatLiveStatus(status));
    return;
  }

  if (command === "pulse") {
    const status = loadLiveStatus(workspaceRoot);
    console.log(formatPulse(status));
    return;
  }

  if (command === "serve-api") {
    const port = args.port ? Number(args.port) : undefined;
    const server = startApiServer({ port });
    const address = server.address();
    const printablePort = typeof address === "object" && address ? address.port : port ?? 4317;
    console.log(`MZTEK API listening on http://localhost:${printablePort}`);
    return;
  }

  if (command === "seed-sample") {
    if (!args.sample) {
      throw new Error("--sample is required");
    }

    const targetDir = args.target ? args.target : process.cwd();
    seedFromSample(workspaceRoot, args.sample, targetDir);
    console.log(`Seeded sample "${args.sample}" into ${targetDir}`);
    return;
  }

  if (command === "dashboard") {
    const port = args.port ? Number(args.port) : 4321;
    const projectDir = dashboardProjectDir(args, workspaceRoot);
    try {
      const server = await startDashboardServer({
        projectDir,
        workspaceRoot,
        port
      });
      const address = server.address();
      const printablePort = typeof address === "object" && address ? address.port : port;
      console.log(`MZTEK dashboard listening on http://localhost:${printablePort} for ${projectDir}`);
      return;
    } catch (error) {
      if (error.code === "EADDRINUSE") {
        throw new Error(`Port ${port} is already in use. Stop the existing process or start with --port=<open-port>, for example: npm run dashboard -- --port=4322`);
      }
      throw error;
    }
  }

  const projectDir = projectDirFromArgs(args);

  const state = loadProjectState(projectDir);

  switch (command) {
    case "status": {
      console.log(formatStatus(state));
      return;
    }
    case "report": {
      console.log(formatProjectReport(state));
      return;
    }
    case "prompt-history": {
      console.log(formatPromptLedger(latestPromptRuns(state, 10)));
      return;
    }
    case "review-history": {
      console.log(formatQaLedger(latestQaReviews(state, 10)));
      return;
    }
    case "record-prompt": {
      if (!args.task || !args.intent || !args.prompt || !args.target || !args.expected) {
        throw new Error("--task, --intent, --prompt, --target, and --expected are required");
      }

      const record = recordPromptRun(state, {
        taskId: args.task,
        userIntent: args.intent,
        governedPrompt: args.prompt,
        target: args.target,
        expectedOutcome: args.expected,
        responseSummary: args.response,
        outcome: args.outcome,
        evidenceQuality: args["evidence-quality"],
        critique: args.critique,
        nextPromptStrategy: args.next
      });
      saveProjectState(projectDir, state);
      console.log(`Prompt recorded: ${record.id}`);
      return;
    }
    case "record-review": {
      if (!args.prompt || !args.task) {
        throw new Error("--prompt and --task are required");
      }

      const record = recordQaReview(state, {
        promptId: args.prompt,
        taskId: args.task,
        reviewer: args.reviewer,
        severity: args.severity,
        failureClass: args.class,
        critique: args.critique,
        evidenceGap: args["evidence-gap"],
        recommendedAction: args.next,
        sourceType: args.source
      });
      saveProjectState(projectDir, state);
      console.log(`QA review recorded: ${record.id}`);
      return;
    }
    case "add-task": {
      if (!args.title) {
        throw new Error("--title is required");
      }

      const task = createTask(state, {
        title: args.title,
        owner: args.owner,
        status: args.status,
        kind: args.kind,
        dependencies: csv(args["depends-on"]),
        requiredEvidence: csv(args["required-evidence"]),
        notes: args.notes
      });
      saveProjectState(projectDir, state);
      console.log(`Created task ${task.id}: ${task.title}`);
      return;
    }
    case "claim-done": {
      if (!args.task) {
        throw new Error("--task is required");
      }

      const task = claimTaskDone(state, args.task, args.note);
      saveProjectState(projectDir, state);
      console.log(`Task ${task.id} marked claimed_done`);
      return;
    }
    case "add-evidence": {
      if (!args.task || !args.type || !args.detail) {
        throw new Error("--task, --type, and --detail are required");
      }

      addEvidence(state, args.task, {
        type: args.type,
        detail: args.detail
      });
      saveProjectState(projectDir, state);
      console.log(`Evidence added to ${args.task}`);
      return;
    }
    case "add-decision": {
      if (!args.summary) {
        throw new Error("--summary is required");
      }

      const decision = addDecision(state, args.summary, args.rationale);
      saveProjectState(projectDir, state);
      console.log(`Decision recorded: ${decision.id}`);
      return;
    }
    case "validate": {
      const result = validateProject(state);
      saveProjectState(projectDir, state);
      console.log(formatValidation(result));
      process.exitCode = result.ok ? 0 : 1;
      return;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
