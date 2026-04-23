function normalize(text) {
  return String(text || "").toLowerCase();
}

function textBlob(task) {
  const parts = [
    task.title,
    task.kind,
    task.notes,
    ...(task.requiredEvidence || []),
    ...(task.evidence || []).flatMap((entry) => [entry.type, entry.detail])
  ];
  return normalize(parts.join(" "));
}

function taskMatchesCheckpoint(task, checkpoint) {
  const haystack = textBlob(task);
  const needles = normalize(`${checkpoint.title} ${checkpoint.category}`).split(/\s+/).filter(Boolean);
  const matchCount = needles.filter((needle) => needle.length > 3 && haystack.includes(needle)).length;
  return matchCount >= 2;
}

export function evaluateBenchmarkCoverage(state) {
  const pack = state.benchmarkPack;
  if (!pack || !Array.isArray(pack.required_checkpoints)) {
    return {
      applicable: false,
      summary: {
        required: 0,
        covered: 0,
        missing: 0
      },
      issues: [],
      suggestions: []
    };
  }

  const covered = [];
  const missing = [];

  for (const checkpoint of pack.required_checkpoints) {
    const matched = state.tasks.items.some((task) => taskMatchesCheckpoint(task, checkpoint));
    if (matched) {
      covered.push(checkpoint);
    } else {
      missing.push(checkpoint);
    }
  }

  const issues = missing.map((checkpoint) => ({
    taskId: "benchmark",
    severity: checkpoint.severity_if_missing || "medium",
    type: "missing_benchmark_checkpoint",
    message: `Benchmark checkpoint missing: ${checkpoint.title}`
  }));

  const suggestions = missing.map((checkpoint) =>
    `Add tracked work and proof requirements for benchmark checkpoint: ${checkpoint.title}`
  );

  return {
    applicable: true,
    summary: {
      required: pack.required_checkpoints.length,
      covered: covered.length,
      missing: missing.length
    },
    issues,
    suggestions
  };
}
