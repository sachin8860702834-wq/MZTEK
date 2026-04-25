import { COUNCIL_ROLES } from "./roles.js";
import { dispatchCouncilAssignments } from "./dispatcher.js";
import { latestCouncilRuns, recordCouncilRun } from "./ledger.js";
import { discoverNvidiaModels } from "../providers/nvidia/discovery.js";
import { routeCouncilTasks } from "../routing/task-router.js";

function now() {
  return new Date().toISOString();
}

function buildAssignments(routes) {
  return routes.map((route) => ({
    roleInfo: COUNCIL_ROLES.find((role) => role.key === route.role),
    model: route.model,
    reason: route.reason,
    startedAt: now()
  }));
}

function chooseBaseRoutes(routes, taskType) {
  const importantTaskTypes = new Set([
    "critical_decision",
    "architecture_decision",
    "risk_decision",
    "security_decision"
  ]);

  if (importantTaskTypes.has(taskType)) {
    const keepRoles = new Set(["builder", "false_positive_detector"]);
    return routes.filter((route) => keepRoles.has(route.role));
  }

  return routes.filter((route) => route.role === "builder");
}

function summarizeRuns(runs, decisionTrace = []) {
  const accepted = runs.filter((item) => item.accepted);
  const rejected = runs.filter((item) => !item.accepted);
  const dispatchFailures = runs.filter((item) => (item.issues || []).includes("dispatch_failure"));

  const usage = runs.reduce((acc, run) => {
    acc.estimatedTokens += Number(run.usage?.estimatedTokens || 0);
    acc.estimatedCostUsd += Number(run.usage?.estimatedCostUsd || 0);
    return acc;
  }, { estimatedTokens: 0, estimatedCostUsd: 0 });

  usage.estimatedCostUsd = Number(usage.estimatedCostUsd.toFixed(6));
  const dispatchFailureRate = runs.length
    ? Number((dispatchFailures.length / runs.length).toFixed(4))
    : 0;

  return {
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    dispatchFailureCount: dispatchFailures.length,
    dispatchFailureRate,
    usage,
    blockers: rejected.flatMap((item) => item.issues || []),
    decisionTrace
  };
}

function reducedRoutes(routes) {
  const keepRoles = new Set(["builder"]);
  return routes.filter((route) => keepRoles.has(route.role));
}

function evaluateMinimalCouncilMode(rootDir) {
  const previousRun = latestCouncilRuns(rootDir, 1)[0];
  if (!previousRun || !Array.isArray(previousRun.runs) || previousRun.runs.length === 0) {
    return {
      enabled: false,
      reason: "No prior council run with dispatch telemetry.",
      dispatchFailureRate: 0
    };
  }

  const failures = previousRun.runs.filter((run) => (run.issues || []).includes("dispatch_failure")).length;
  const dispatchFailureRate = failures / previousRun.runs.length;
  const enabled = dispatchFailureRate > 0.5;

  return {
    enabled,
    reason: enabled
      ? `Previous dispatch failure rate ${(dispatchFailureRate * 100).toFixed(1)}% exceeded 50%, using minimal council mode.`
      : `Previous dispatch failure rate ${(dispatchFailureRate * 100).toFixed(1)}% is within normal range.`,
    dispatchFailureRate: Number(dispatchFailureRate.toFixed(4))
  };
}

function nextFallbackModel(allModels = [], tried = []) {
  return allModels.find((model) => !tried.includes(model)) || "";
}

async function retryUnavailableModelRuns({
  baseUrl,
  apiKey,
  routes,
  runs,
  taskId,
  messages,
  discovery,
  fetchImpl
}) {
  const failed404 = runs.filter((run) => (run.issues || []).includes("model_unavailable_404"));
  if (!failed404.length) {
    return { runs, retryTrace: [] };
  }

  const retriedRuns = [...runs];
  const retryTrace = [];
  for (const failed of failed404) {
    const route = routes.find((item) => item.role === failed.role);
    const roleInfo = COUNCIL_ROLES.find((role) => role.key === failed.role);
    if (!route || !roleInfo) {
      continue;
    }

    const fallbackModel = nextFallbackModel(discovery.models, [failed.model]);
    if (!fallbackModel) {
      retryTrace.push({
        at: now(),
        type: "fallback_retry",
        role: failed.role,
        outcome: "no_fallback_available",
        reason: "No additional NVIDIA model id available for retry."
      });
      continue;
    }

    const retried = await dispatchCouncilAssignments({
      baseUrl,
      apiKey,
      assignments: [{ roleInfo, model: fallbackModel, reason: "404 fallback retry", startedAt: now() }],
      taskId,
      messages,
      fetchImpl
    });

    const retriedRun = retried[0];
    retriedRuns.push(retriedRun);
    retryTrace.push({
      at: now(),
      type: "fallback_retry",
      role: failed.role,
      fromModel: failed.model,
      toModel: fallbackModel,
      outcome: retriedRun.accepted ? "accepted" : "rejected",
      reason: retriedRun.reason || retriedRun.error || "Retry completed."
    });
  }

  return { runs: retriedRuns, retryTrace };
}

export async function runNvidiaWorkerCouncil({
  rootDir,
  baseUrl,
  apiKey,
  taskType = "analysis",
  taskId = "TASK-UNKNOWN",
  messages,
  env = process.env,
  fetchImpl = fetch
}) {
  const discovery = await discoverNvidiaModels({
    baseUrl,
    apiKey,
    env,
    fetchImpl
  });

  if (!discovery.models.length) {
    return {
      ok: false,
      error: "No NVIDIA models are available for council routing.",
      discovery
    };
  }

  const routes = routeCouncilTasks({
    registry: discovery.registry,
    taskType
  });

  if (!routes.length) {
    return {
      ok: false,
      error: "Council router could not assign any role to a model.",
      discovery
    };
  }

  const baseRoutes = chooseBaseRoutes(routes, taskType);
  const minimalMode = evaluateMinimalCouncilMode(rootDir);
  const routedRoles = minimalMode.enabled ? reducedRoutes(baseRoutes) : baseRoutes;
  const effectiveRoutes = routedRoles.length ? routedRoles : baseRoutes;
  const decisionTrace = [
    {
      at: now(),
      type: "routing_mode",
      mode: minimalMode.enabled ? "minimal" : "full",
      reason: minimalMode.reason,
      dispatchFailureRate: minimalMode.dispatchFailureRate,
      selectedRoles: effectiveRoutes.map((route) => route.role),
      providerPolicy: "NVIDIA-only worker execution. Non-NVIDIA worker runs are invalid."
    }
  ];

  const assignments = buildAssignments(effectiveRoutes);
  const initialRuns = await dispatchCouncilAssignments({
    baseUrl,
    apiKey,
    assignments,
    taskId,
    messages,
    fetchImpl
  });
  const retried = await retryUnavailableModelRuns({
    baseUrl,
    apiKey,
    routes: effectiveRoutes,
    runs: initialRuns,
    taskId,
    messages,
    discovery,
    fetchImpl
  });
  const runs = retried.runs;
  decisionTrace.push(...retried.retryTrace);

  const summary = summarizeRuns(runs, decisionTrace);
  const acceptedRuns = runs.filter((item) => item.accepted);

  const councilRun = {
    id: `COUNCIL-${Date.now()}`,
    createdAt: now(),
    taskType,
    taskId,
    discoverySource: discovery.source,
    modelCount: discovery.models.length,
    routes: effectiveRoutes,
    routingMode: minimalMode.enabled ? "minimal" : "full",
    decisionTrace,
    runs,
    accepted: acceptedRuns.length > 0 && summary.rejectedCount === 0,
    summary
  };

  recordCouncilRun(rootDir, councilRun);

  return {
    ok: true,
    councilRun,
    routes: effectiveRoutes,
    runs,
    summary,
    discovery
  };
}
