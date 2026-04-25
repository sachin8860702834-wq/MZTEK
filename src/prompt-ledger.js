function isoNow() {
  return new Date().toISOString();
}

function nextPromptId(state) {
  const id = state.prompts.nextId || 1;
  state.prompts.nextId = id + 1;
  return `PROMPT-${String(id).padStart(3, "0")}`;
}

function versionForTask(state, taskId) {
  const matches = state.prompts.items.filter((item) => item.taskId === taskId);
  return matches.length + 1;
}

export function recordPromptRun(state, input) {
  const record = {
    id: nextPromptId(state),
    taskId: input.taskId || "unscoped",
    version: versionForTask(state, input.taskId || "unscoped"),
    userIntent: input.userIntent || "",
    governedPrompt: input.governedPrompt || "",
    target: input.target || "unknown",
    expectedOutcome: input.expectedOutcome || "",
    responseSummary: input.responseSummary || "",
    outcome: input.outcome || "partial",
    evidenceQuality: input.evidenceQuality || "unknown",
    critique: input.critique || "",
    nextPromptStrategy: input.nextPromptStrategy || "",
    createdAt: isoNow()
  };

  state.prompts.items.push(record);
  state.project.updatedAt = record.createdAt;
  return record;
}

export function latestPromptRuns(state, limit = 5) {
  return state.prompts.items.slice().reverse().slice(0, limit);
}

export function formatPromptHistory(state) {
  const entries = latestPromptRuns(state, 10);
  const lines = [`Prompt Ledger: ${entries.length ? "latest entries" : "empty"}`];

  if (entries.length === 0) {
    lines.push("- No prompt runs recorded yet.");
    return lines.join("\n");
  }

  for (const item of entries) {
    lines.push(`- ${item.id} | task ${item.taskId} | ${item.target} | ${item.outcome} | evidence ${item.evidenceQuality}`);
    if (item.critique) {
      lines.push(`  critique: ${item.critique}`);
    }
    if (item.nextPromptStrategy) {
      lines.push(`  next: ${item.nextPromptStrategy}`);
    }
  }

  return lines.join("\n");
}
