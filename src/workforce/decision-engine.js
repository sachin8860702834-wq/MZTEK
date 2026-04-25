function scoreRun(run) {
  if (!run.ok) {
    return -1000;
  }

  const lengthScore = Math.max(0, 400 - String(run.content || "").length);
  return 100 + lengthScore;
}

export function decisionEngine({ runs }) {
  if (!runs.length) {
    return {
      ok: false,
      reason: "No model runs were dispatched."
    };
  }

  const ranked = [...runs].sort((left, right) => scoreRun(right) - scoreRun(left));
  const chosen = ranked[0];

  if (!chosen.ok) {
    return {
      ok: false,
      reason: "All model runs failed.",
      chosen,
      runs
    };
  }

  return {
    ok: true,
    chosen,
    reason: `Selected ${chosen.model} based on successful structured output and concise response.`,
    runs
  };
}
