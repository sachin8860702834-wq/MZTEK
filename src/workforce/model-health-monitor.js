const modelHealth = new Map();

function defaults(model) {
  return modelHealth.get(model) || {
    model,
    successCount: 0,
    failureCount: 0,
    lastError: "",
    lastUpdatedAt: ""
  };
}

export function modelHealthMonitorUpdate(run) {
  const current = defaults(run.model);
  const next = {
    ...current,
    successCount: current.successCount + (run.ok ? 1 : 0),
    failureCount: current.failureCount + (run.ok ? 0 : 1),
    lastError: run.ok ? "" : String(run.error || "Unknown model error"),
    lastUpdatedAt: new Date().toISOString()
  };
  modelHealth.set(run.model, next);
  return next;
}

export function modelHealthSnapshot() {
  return [...modelHealth.values()];
}
