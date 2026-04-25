function parseJsonFromText(text) {
  const value = String(text || "").trim();
  if (!value) {
    return null;
  }

  const fenced = value.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      return null;
    }
  }

  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(value.slice(first, last + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function hasAny(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(String(value || "").trim());
}

function shapeOutput(output) {
  const parsed = parseJsonFromText(output);
  if (parsed) {
    return parsed;
  }

  return {
    taskId: "",
    inputSummary: "",
    proposedChange: String(output || ""),
    filesAffected: [],
    confidence: {
      score: "low",
      reason: "Unstructured response."
    },
    evidence: [],
    validationRequirement: "",
    risks: ["Unstructured agent output."],
    unknowns: ["Agent output was not JSON."]
  };
}

export function validateCouncilOutput({
  role,
  output
}) {
  const shaped = shapeOutput(output);
  const issues = [];

  if (!hasAny(shaped.taskId)) {
    issues.push("missing_task_id");
  }
  if (!hasAny(shaped.inputSummary)) {
    issues.push("missing_input_summary");
  }
  if (!hasAny(shaped.proposedChange)) {
    issues.push("missing_proposed_change");
  }
  if (!hasAny(shaped.filesAffected)) {
    issues.push("missing_files_affected");
  }
  if (!hasAny(shaped.evidence)) {
    issues.push("missing_evidence");
  }
  if (!hasAny(shaped.validationRequirement)) {
    issues.push("missing_validation_requirement");
  }
  if (role === "builder" && !hasAny(shaped.testPlan || shaped.validationRequirement)) {
    issues.push("missing_test_plan");
  }

  const riskText = JSON.stringify(shaped).toLowerCase();
  if (
    riskText.includes("nvapi-") ||
    riskText.includes("ghp_") ||
    riskText.includes("token") && riskText.includes("secret")
  ) {
    issues.push("secret_exposure_risk");
  }

  return {
    accepted: issues.length === 0,
    issues,
    shaped
  };
}
