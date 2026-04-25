function scoreValue(value) {
  if (value === "high") {
    return 3;
  }
  if (value === "medium") {
    return 2;
  }
  return 1;
}

const roleTaskMap = {
  builder: "code_generation",
  qa: "qa_review",
  security: "security_review",
  architect: "architecture_review",
  documentation: "summarization",
  false_positive_detector: "false_positive_detection"
};

function byCost(candidate) {
  return scoreValue(candidate.capability.cost);
}

function byQuality(candidate) {
  return scoreValue(candidate.capability.score);
}

function bySpeed(candidate) {
  return scoreValue(candidate.capability.speed);
}

export function routeCouncilTasks({
  registry,
  taskType = "analysis"
}) {
  const models = registry?.items || [];
  if (!models.length) {
    return [];
  }

  const assignments = [];

  for (const [role, capabilityKey] of Object.entries(roleTaskMap)) {
    const candidates = models
      .map((item) => ({
        model: item.model,
        role,
        capability: item.capability[capabilityKey]
      }))
      .filter((item) => item.capability);

    if (!candidates.length) {
      continue;
    }

    let sorted = candidates;
    if (capabilityKey === "summarization") {
      sorted = [...candidates].sort((left, right) => byCost(left) - byCost(right));
    } else if (capabilityKey === "code_generation") {
      sorted = [...candidates].sort((left, right) => byQuality(right) - byQuality(left));
    } else if (capabilityKey === "qa_review" || capabilityKey === "security_review" || capabilityKey === "architecture_review" || capabilityKey === "false_positive_detection") {
      sorted = [...candidates].sort((left, right) => {
        const quality = byQuality(right) - byQuality(left);
        if (quality !== 0) {
          return quality;
        }
        return bySpeed(right) - bySpeed(left);
      });
    }

    const chosen = sorted[0];
    assignments.push({
      role,
      capabilityKey,
      model: chosen.model,
      reason: `Routed ${role} using ${capabilityKey} capability for ${taskType}.`
    });
  }

  return assignments;
}
