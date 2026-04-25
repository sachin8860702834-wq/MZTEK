function capabilityTemplate(cost = "medium", speed = "medium", quality = "medium") {
  return {
    summarization: { score: quality, cost, speed },
    code_generation: { score: quality, cost, speed },
    qa_review: { score: quality, cost, speed },
    security_review: { score: quality, cost, speed },
    architecture_review: { score: quality, cost, speed },
    false_positive_detection: { score: quality, cost, speed }
  };
}

const defaults = {
  cheap: capabilityTemplate("low", "high", "medium"),
  coder: capabilityTemplate("medium", "medium", "high"),
  reasoner: capabilityTemplate("high", "low", "high")
};

function applyOverrides(capability, overrides = {}) {
  return {
    ...capability,
    ...overrides
  };
}

function classifyModel(model) {
  const value = String(model || "").toLowerCase();

  if (!value) {
    return {
      tier: "cheap",
      capability: defaults.cheap
    };
  }

  if (
    value.includes("coder") ||
    value.includes("codestral") ||
    value.includes("codegemma") ||
    value.includes("starcoder")
  ) {
    return {
      tier: "coder",
      capability: applyOverrides(defaults.coder, {
        security_review: { score: "medium", cost: "medium", speed: "medium" }
      })
    };
  }

  if (
    value.includes("70b") ||
    value.includes("120b") ||
    value.includes("405b") ||
    value.includes("reason") ||
    value.includes("nemotron") ||
    value.includes("gpt-oss-120b")
  ) {
    return {
      tier: "reasoner",
      capability: applyOverrides(defaults.reasoner, {
        summarization: { score: "high", cost: "medium", speed: "medium" },
        code_generation: { score: "high", cost: "high", speed: "medium" }
      })
    };
  }

  return {
    tier: "cheap",
    capability: defaults.cheap
  };
}

export function buildModelCapabilityRegistry(models = []) {
  const items = models.map((model) => {
    const { tier, capability } = classifyModel(model);
    return {
      model,
      tier,
      capability
    };
  });

  return {
    provider: "nvidia",
    discoveredAt: new Date().toISOString(),
    items
  };
}
