import fs from "node:fs";
import path from "node:path";

function lowerList(items = []) {
  return items.map((item) => String(item).toLowerCase());
}

function evidenceCorpus(fixture) {
  const tests = fixture.evidence?.tests_run || [];
  const screenshots = fixture.evidence?.screenshots || [];
  const runtime = fixture.evidence?.runtime_validation || [];
  const notes = fixture.evidence?.notes || [];
  const details = fixture.agent_output?.details || [];
  return lowerList([...tests, ...screenshots, ...runtime, ...notes, ...details]);
}

function hasKeyword(corpus, keywords) {
  return keywords.some((keyword) => corpus.some((item) => item.includes(keyword)));
}

function deriveMissingProof(fixture, missingDependencies) {
  const criteria = fixture.context?.required_completion_criteria || [];
  const corpus = evidenceCorpus(fixture);
  const missing = [];

  for (const criterion of criteria) {
    const line = criterion.toLowerCase();

    if ((line.includes("live") || line.includes("backend") || line.includes("api")) &&
        (missingDependencies.length > 0 || !hasKeyword(corpus, ["verified", "success", "api", "runtime"]))) {
      missing.push("Runtime evidence showing the required integration actually works");
      continue;
    }

    if (line.includes("responsive") && !hasKeyword(corpus, ["responsive", "mobile", "tablet", "desktop"])) {
      missing.push("Responsive verification evidence");
      continue;
    }

    if ((line.includes("loading") || line.includes("empty") || line.includes("error")) &&
        !hasKeyword(corpus, ["loading", "empty", "error"])) {
      missing.push("Evidence for loading, empty, and error states");
      continue;
    }

    if ((line.includes("environment") || line.includes("schema")) &&
        !hasKeyword(corpus, ["env", "environment", "schema", "migration", "table"])) {
      missing.push("Environment and schema readiness proof");
      continue;
    }

    if (line.includes("email") && !hasKeyword(corpus, ["email", "dispatch", "sender", "verification"])) {
      missing.push("Verification email dispatch evidence");
      continue;
    }

    if ((line.includes("proof") || line.includes("validated") || line.includes("verification")) &&
        !hasKeyword(corpus, ["verified", "validation", "review", "check", "proof"])) {
      missing.push("Validation evidence for the declared completion criteria");
    }
  }

  return [...new Set(missing)];
}

function deriveFindings(fixture, missingDependencies, missingProof) {
  const findings = [];
  const details = fixture.agent_output?.details || [];
  const claim = fixture.agent_output?.claim || "";

  if (/(done|complete|ready)/i.test(claim) && (missingDependencies.length > 0 || missingProof.length > 0)) {
    findings.push("Completion claim is not supported by the available proof.");
  }

  if (missingDependencies.length > 0) {
    findings.push(`Feature depends on unresolved dependencies: ${missingDependencies.join(", ")}.`);
  }

  for (const detail of details) {
    if (/placeholder|mock|not yet|did not|missing|assumed/i.test(detail)) {
      findings.push(detail);
    }
  }

  if (findings.length === 0) {
    findings.push("Declared completion criteria appear to be satisfied with available evidence.");
  }

  return findings;
}

function nextActionsFor(status, missingDependencies, missingProof) {
  const actions = [];

  if (missingDependencies.length > 0) {
    actions.push(`Resolve missing dependencies: ${missingDependencies.join(", ")}`);
  }

  if (missingProof.length > 0) {
    actions.push("Collect the missing proof before allowing the task to be marked complete.");
  }

  if (status === "validated") {
    actions.push("Mark the feature complete and retain this as a positive regression case.");
  } else {
    actions.push("Downgrade completion status until evidence and dependency closure exist.");
  }

  return actions;
}

export function evaluateFixture(fixture) {
  const missingDependencies = (fixture.dependencies || [])
    .filter((dependency) => dependency.status !== "resolved")
    .map((dependency) => dependency.name);

  const missingProof = deriveMissingProof(fixture, missingDependencies);
  const unresolvedBackbone = (fixture.dependencies || []).some((dependency) =>
    dependency.status !== "resolved" &&
    ["api_route", "database_schema", "env_var", "service_integration", "truthfulness_requirement", "artifact_integrity_requirement", "security_requirement"].includes(dependency.type)
  );
  const missingBackboneCount = (fixture.dependencies || []).filter((dependency) =>
    dependency.status !== "resolved" &&
    ["api_route", "database_schema", "env_var", "service_integration", "truthfulness_requirement", "artifact_integrity_requirement", "security_requirement"].includes(dependency.type)
  ).length;

  let status = "validated";
  let severity = "low";

  if (
    missingDependencies.length > 0 &&
    unresolvedBackbone &&
    (fixture.category === "missing_dependency" || missingBackboneCount > 1)
  ) {
    status = "blocked";
    severity = "critical";
  } else if (missingDependencies.length > 0 || missingProof.length > 0) {
    status = "suspicious";
    severity = "high";
  }

  const findings = deriveFindings(fixture, missingDependencies, missingProof);

  return {
    fixtureId: fixture.fixture_id,
    name: fixture.name,
    status,
    severity,
    summary: findings[0],
    findings,
    missing_proof: missingProof,
    missing_dependencies: missingDependencies,
    next_actions: nextActionsFor(status, missingDependencies, missingProof)
  };
}

export function loadFixture(filePath) {
  const resolved = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}
