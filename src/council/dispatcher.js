import { nvidiaChatCompletion } from "../providers/nvidia/client.js";
import { validateCouncilOutput } from "../governance/zero-trust-gate.js";

function estimateUsage({
  messages,
  content,
  usage
}) {
  if (usage?.total_tokens) {
    return {
      estimatedTokens: usage.total_tokens,
      estimatedCostUsd: Number((usage.total_tokens * 0.000001).toFixed(6))
    };
  }

  const inputChars = JSON.stringify(messages || []).length;
  const outputChars = String(content || "").length;
  const estimatedTokens = Math.ceil((inputChars + outputChars) / 4);
  return {
    estimatedTokens,
    estimatedCostUsd: Number((estimatedTokens * 0.000001).toFixed(6))
  };
}

function rolePrompt(role, taskId) {
  return [
    `You are the ${role.title}.`,
    "Return valid JSON only.",
    "Mandatory keys:",
    "taskId, inputSummary, proposedChange, filesAffected, confidence, evidence, validationRequirement, risks, unknowns, testPlan",
    `Set taskId exactly to "${taskId}".`,
    "filesAffected and evidence must be arrays.",
    "confidence must be an object: { score, reason }.",
    "Avoid secret values in output."
  ].join(" ");
}

export async function dispatchCouncilAssignments({
  baseUrl,
  apiKey,
  assignments,
  taskId,
  messages,
  fetchImpl = fetch
}) {
  const runs = [];

  for (const assignment of assignments) {
    const roleMessage = {
      role: "system",
      content: rolePrompt(assignment.roleInfo, taskId)
    };

    const response = await nvidiaChatCompletion({
      baseUrl,
      apiKey,
      model: assignment.model,
      messages: [roleMessage, ...messages],
      fetchImpl
    });

    if (!response.ok) {
      const dispatchIssues = ["dispatch_failure"];
      if (Number(response.status) === 404) {
        dispatchIssues.push("model_unavailable_404");
      }
      runs.push({
        role: assignment.roleInfo.key,
        taskId,
        provider: "nvidia",
        model: assignment.model,
        ok: false,
        accepted: false,
        issues: dispatchIssues,
        responseStatus: Number(response.status) || 0,
        workerRunValidation: "NVIDIA_ATTEMPT_FAILED",
        error: response.error,
        output: null,
        usage: estimateUsage({
          messages: [roleMessage, ...messages],
          content: "",
          usage: response.usage
        }),
        startedAt: assignment.startedAt,
        finishedAt: new Date().toISOString()
      });
      continue;
    }

    const validation = validateCouncilOutput({
      role: assignment.roleInfo.key,
      output: response.content
    });

    if ("nvidia" !== "nvidia") {
      validation.accepted = false;
      validation.issues = [...(validation.issues || []), "INVALID_WORKER_RUN"];
    }

    const accepted = validation.accepted && "nvidia" === "nvidia";
    const reason = accepted
      ? "Accepted: NVIDIA provider run passed zero-trust validation."
      : validation.issues?.includes("INVALID_WORKER_RUN")
        ? "Rejected: worker task did not run on NVIDIA provider."
        : "Rejected: zero-trust validation issues.";

    runs.push({
      role: assignment.roleInfo.key,
      taskId,
      provider: "nvidia",
      model: assignment.model,
      ok: true,
      accepted,
      issues: validation.issues,
      responseStatus: 200,
      workerRunValidation: accepted ? "VALID_NVIDIA_WORKER_RUN" : "INVALID_WORKER_RUN",
      reason,
      error: "",
      output: validation.shaped,
      usage: estimateUsage({
        messages: [roleMessage, ...messages],
        content: response.content,
        usage: response.usage
      }),
      startedAt: assignment.startedAt,
      finishedAt: new Date().toISOString()
    });
  }

  return runs;
}
