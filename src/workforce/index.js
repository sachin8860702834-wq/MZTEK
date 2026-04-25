import { runNvidiaWorkerCouncil } from "../council/pipeline.js";
import { latestCouncilRuns, summarizeCouncilUsage } from "../council/ledger.js";
import { modelHealthMonitorUpdate, modelHealthSnapshot } from "./model-health-monitor.js";

function buildPlanningPayload({ taskType, taskId, acceptedRuns }) {
  const byRole = Object.fromEntries(
    acceptedRuns.map((run) => [run.role, run.output])
  );
  const now = new Date().toISOString();

  const summary =
    byRole.architect?.proposedChange ||
    byRole.builder?.proposedChange ||
    byRole.documentation?.proposedChange ||
    `NVIDIA council completed ${acceptedRuns.length} accepted role outputs for ${taskType}.`;

  const tasks = acceptedRuns.map((run, index) => ({
    id: `${taskId}-${String(index + 1).padStart(2, "0")}`,
    title: `${run.role.replaceAll("_", " ")} action`,
    description: run.output.proposedChange,
    status: run.accepted ? "active" : "blocked",
    column: run.role === "documentation" ? "planning" : run.role === "qa" || run.role === "false_positive_detector" ? "reviewing" : "building",
    proof: run.output.evidence?.[0] || "council output",
    updatedAt: now
  }));

  const decisions = acceptedRuns.map((run) => ({
    decision: `${run.role} recommends ${run.output.proposedChange}`,
    reason: run.output.confidence?.reason || "No confidence reason provided.",
    evidence: (run.output.evidence || []).join(" | ") || "No evidence.",
    impact: run.output.validationRequirement || "Validation still required.",
    at: now
  }));

  const risks = acceptedRuns.flatMap((run) => run.output.risks || []).slice(0, 6);
  const nextActions = acceptedRuns
    .map((run) => run.output.validationRequirement)
    .filter(Boolean)
    .slice(0, 5);

  return {
    summary,
    contextSummary: acceptedRuns.map((run) => run.output.inputSummary).filter(Boolean).slice(0, 6),
    projectType: "AI-assisted product system",
    tasks,
    activity: acceptedRuns.map((run) => ({
      kind: run.role === "qa" ? "review" : run.role === "architect" ? "decision" : "system",
      title: `${run.role.replaceAll("_", " ")} completed`,
      detail: run.output.proposedChange,
      at: now
    })),
    decisions,
    risks: risks.length ? risks : ["No major risks were reported by the council."],
    nextActions: nextActions.length ? nextActions : ["Review council output and run validations."]
  };
}

export async function runNvidiaWorkforceTask({
  rootDir,
  env = process.env,
  fetchImpl = fetch,
  taskType = "analysis",
  taskId = "TASK-UNKNOWN",
  messages
}) {
  const council = await runNvidiaWorkerCouncil({
    rootDir,
    baseUrl: env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    apiKey: env.NVIDIA_API_KEY,
    taskType,
    taskId,
    messages,
    env,
    fetchImpl
  });

  if (!council.ok) {
    return {
      ok: false,
      error: council.error || "NVIDIA council execution failed."
    };
  }

  for (const run of council.runs) {
    modelHealthMonitorUpdate(run);
  }

  const acceptedRuns = council.runs.filter((run) => run.accepted);
  if (!acceptedRuns.length) {
    return {
      ok: false,
      error: "All council outputs were rejected by zero-trust validation.",
      runs: council.runs,
      health: modelHealthSnapshot(),
      council: {
        summary: council.summary,
        routes: council.routes
      }
    };
  }

  const planningPayload = buildPlanningPayload({
    taskType,
    taskId,
    acceptedRuns
  });

  const chosen = acceptedRuns.find((run) => run.role === "architect") || acceptedRuns[0];
  const usage = council.summary.usage;

  return {
    ok: true,
    chosen: {
      model: chosen.model,
      content: JSON.stringify(planningPayload)
    },
    decisionReason: `Selected ${chosen.role} output after council routing and zero-trust validation.`,
    runs: council.runs,
    health: modelHealthSnapshot(),
    council: {
      summary: council.summary,
      routes: council.routes,
      recentRuns: latestCouncilRuns(rootDir, 5),
      usage: summarizeCouncilUsage(rootDir),
      planningPayload
    },
    usage
  };
}
