import { evaluateBenchmarkCoverage } from "./benchmark-validator.js";

function evidenceTypes(task) {
  return new Set(task.evidence.map((entry) => entry.type));
}

function hasRequiredEvidence(task) {
  const present = evidenceTypes(task);
  return task.requiredEvidence.every((required) => present.has(required));
}

function dependencyMap(tasks) {
  return new Map(tasks.map((task) => [task.id, task]));
}

export function validateProject(state) {
  const issues = [];
  const taskMap = dependencyMap(state.tasks.items);
  let verifiedCount = 0;

  for (const task of state.tasks.items) {
    const missingDependencies = task.dependencies.filter((id) => {
      const dependency = taskMap.get(id);
      return !dependency || !dependency.verifiedDone;
    });

    if (missingDependencies.length > 0) {
      issues.push({
        taskId: task.id,
        severity: "high",
        type: "missing_dependency",
        message: `Task depends on unverified work: ${missingDependencies.join(", ")}`
      });
      if (!task.claimedDone) {
        task.status = "blocked";
      }
    }

    if (task.claimedDone) {
      if (!hasRequiredEvidence(task)) {
        issues.push({
          taskId: task.id,
          severity: "critical",
          type: "fake_done",
          message: `Task was marked done without required evidence: ${task.requiredEvidence.join(", ")}`
        });
        task.verifiedDone = false;
        task.status = "needs_validation";
      } else if (missingDependencies.length === 0) {
        task.verifiedDone = true;
        task.status = "done";
        verifiedCount += 1;
      }
    } else if (hasRequiredEvidence(task) && missingDependencies.length === 0) {
      issues.push({
        taskId: task.id,
        severity: "medium",
        type: "proof_without_claim",
        message: "Task has evidence but has not been explicitly claimed complete."
      });
    }
  }

  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const high = issues.filter((issue) => issue.severity === "high").length;
  const medium = issues.filter((issue) => issue.severity === "medium").length;
  const verifiedRatio = state.tasks.items.length === 0 ? 0 : verifiedCount / state.tasks.items.length;
  const benchmark = evaluateBenchmarkCoverage(state);

  issues.push(...benchmark.issues);

  const criticalWithBenchmark = issues.filter((issue) => issue.severity === "critical").length;
  const highWithBenchmark = issues.filter((issue) => issue.severity === "high").length;
  const mediumWithBenchmark = issues.filter((issue) => issue.severity === "medium").length;

  const run = {
    runAt: new Date().toISOString(),
    summary: {
      taskCount: state.tasks.items.length,
      verifiedCount,
      critical: criticalWithBenchmark,
      high: highWithBenchmark,
      medium: mediumWithBenchmark
    },
    issues,
    benchmark
  };

  state.validations.runs.push(run);
  state.project.updatedAt = run.runAt;

  return {
    ok: criticalWithBenchmark === 0,
    score: Math.max(0, Math.round((verifiedRatio * 100) - criticalWithBenchmark * 20 - highWithBenchmark * 10 - mediumWithBenchmark * 5)),
    run
  };
}
