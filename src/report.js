export function formatStatus(state) {
  const tasks = state.tasks.items;
  const grouped = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const lines = [
    `Project: ${state.project.name}`,
    `Phase: ${state.project.currentPhase}`,
    `Status: ${state.project.status}`,
    `Sample Project: ${state.project.sampleProject || "none"}`,
    `Benchmark Pack: ${state.project.benchmarkPack || "none"}`,
    `Tasks: ${tasks.length}`,
    `Decisions: ${state.decisions.items.length}`,
    "Task Status Breakdown:"
  ];

  if (tasks.length === 0) {
    lines.push("- No tasks yet.");
  } else {
    for (const [status, count] of Object.entries(grouped).sort()) {
      lines.push(`- ${status}: ${count}`);
    }
  }

  const latestRun = state.validations.runs[state.validations.runs.length - 1];
  if (latestRun) {
    lines.push("Latest Validation:");
    lines.push(`- Ran at: ${latestRun.runAt}`);
    lines.push(`- Critical: ${latestRun.summary.critical}`);
    lines.push(`- High: ${latestRun.summary.high}`);
    lines.push(`- Medium: ${latestRun.summary.medium}`);
    if (latestRun.benchmark?.applicable) {
      lines.push(`- Benchmark coverage: ${latestRun.benchmark.summary.covered}/${latestRun.benchmark.summary.required}`);
    }
  }

  return lines.join("\n");
}

export function formatValidation(result) {
  const lines = [
    `Validation Score: ${result.score}`,
    `Validation OK: ${result.ok ? "yes" : "no"}`,
    `Tasks checked: ${result.run.summary.taskCount}`,
    `Verified tasks: ${result.run.summary.verifiedCount}`,
    `Critical issues: ${result.run.summary.critical}`,
    `High issues: ${result.run.summary.high}`,
    `Medium issues: ${result.run.summary.medium}`
  ];

  if (result.run.issues.length > 0) {
    lines.push("Issues:");
    for (const issue of result.run.issues) {
      lines.push(`- [${issue.severity}] ${issue.taskId}: ${issue.message}`);
    }
  }

  if (result.run.benchmark?.applicable) {
    lines.push("Benchmark Coverage:");
    lines.push(`- Required checkpoints: ${result.run.benchmark.summary.required}`);
    lines.push(`- Covered checkpoints: ${result.run.benchmark.summary.covered}`);
    lines.push(`- Missing checkpoints: ${result.run.benchmark.summary.missing}`);
    if (result.run.benchmark.suggestions.length > 0) {
      lines.push("Benchmark Suggestions:");
      for (const item of result.run.benchmark.suggestions) {
        lines.push(`- ${item}`);
      }
    }
  }

  return lines.join("\n");
}

export function formatProjectReport(state) {
  const lines = [
    `Project Report: ${state.project.name}`,
    `Summary: ${state.project.summary || "No project summary yet."}`,
    `Current Phase: ${state.project.currentPhase}`,
    `Project Status: ${state.project.status}`,
    `Sample Project: ${state.project.sampleProject || "none"}`,
    `Benchmark Pack: ${state.project.benchmarkPack || "none"}`,
    ""
  ];

  const blocked = state.tasks.items.filter((task) => task.status === "blocked" || task.status === "needs_validation");
  const claimed = state.tasks.items.filter((task) => task.status === "claimed_done");
  const todo = state.tasks.items.filter((task) => task.status === "todo");
  const done = state.tasks.items.filter((task) => task.status === "done");

  lines.push(`Task Totals: ${state.tasks.items.length} total, ${done.length} done, ${todo.length} todo, ${blocked.length} blocked/needs validation, ${claimed.length} claimed`);
  lines.push("");

  if (state.decisions.items.length > 0) {
    lines.push("Recent Decisions:");
    for (const decision of state.decisions.items.slice(-3)) {
      lines.push(`- ${decision.summary}`);
    }
    lines.push("");
  }

  if (blocked.length > 0) {
    lines.push("Blocked or At-Risk Tasks:");
    for (const task of blocked) {
      lines.push(`- ${task.id}: ${task.title} (${task.status})`);
    }
    lines.push("");
  }

  if (todo.length > 0) {
    lines.push("Next Candidate Tasks:");
    for (const task of todo.slice(0, 3)) {
      lines.push(`- ${task.id}: ${task.title} [owner: ${task.owner}]`);
    }
    lines.push("");
  }

  const latestRun = state.validations.runs[state.validations.runs.length - 1];
  if (latestRun) {
    lines.push("Latest Validation Snapshot:");
    lines.push(`- Critical issues: ${latestRun.summary.critical}`);
    lines.push(`- High issues: ${latestRun.summary.high}`);
    lines.push(`- Medium issues: ${latestRun.summary.medium}`);
    if (latestRun.benchmark?.applicable) {
      lines.push(`- Benchmark coverage: ${latestRun.benchmark.summary.covered}/${latestRun.benchmark.summary.required}`);
      const topSuggestions = latestRun.benchmark.suggestions.slice(0, 3);
      if (topSuggestions.length > 0) {
        lines.push("Top Benchmark Gaps:");
        for (const suggestion of topSuggestions) {
          lines.push(`- ${suggestion}`);
        }
      }
    }
    lines.push("");
  }

  if (state.sampleContext?.core_value?.length) {
    lines.push("Sample Context Signals:");
    for (const item of state.sampleContext.core_value.slice(0, 3)) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join("\n").trim();
}

export function formatFixtureEvaluation(result) {
  const lines = [
    `Fixture: ${result.name}`,
    `Status: ${result.status}`,
    `Severity: ${result.severity}`,
    `Summary: ${result.summary}`
  ];

  if (result.findings.length > 0) {
    lines.push("Findings:");
    for (const finding of result.findings) {
      lines.push(`- ${finding}`);
    }
  }

  if (result.missing_dependencies.length > 0) {
    lines.push("Missing Dependencies:");
    for (const item of result.missing_dependencies) {
      lines.push(`- ${item}`);
    }
  }

  if (result.missing_proof.length > 0) {
    lines.push("Missing Proof:");
    for (const item of result.missing_proof) {
      lines.push(`- ${item}`);
    }
  }

  if (result.next_actions.length > 0) {
    lines.push("Next Actions:");
    for (const item of result.next_actions) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join("\n");
}

export function formatPromptLedger(entries) {
  const lines = ["Prompt Ledger:"];

  if (!entries.length) {
    lines.push("- No prompt runs recorded yet.");
    return lines.join("\n");
  }

  for (const item of entries) {
    lines.push(`- ${item.id} | task ${item.taskId} | target ${item.target} | outcome ${item.outcome} | evidence ${item.evidenceQuality}`);
    if (item.critique) {
      lines.push(`  critique: ${item.critique}`);
    }
    if (item.nextPromptStrategy) {
      lines.push(`  next: ${item.nextPromptStrategy}`);
    }
  }

  return lines.join("\n");
}

export function formatQaLedger(entries) {
  const lines = ["QA Review Ledger:"];

  if (!entries.length) {
    lines.push("- No QA reviews recorded yet.");
    return lines.join("\n");
  }

  for (const item of entries) {
    lines.push(`- ${item.id} | prompt ${item.promptId} | task ${item.taskId} | severity ${item.severity} | class ${item.failureClass}`);
    if (item.critique) {
      lines.push(`  critique: ${item.critique}`);
    }
    if (item.recommendedAction) {
      lines.push(`  next: ${item.recommendedAction}`);
    }
  }

  return lines.join("\n");
}
