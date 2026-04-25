import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runNvidiaWorkerCouncil } from "../src/council/pipeline.js";
import { recordCouncilRun } from "../src/council/ledger.js";

function makeTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mztek-council-"));
  fs.mkdirSync(path.join(root, ".mztek"), { recursive: true });
  return root;
}

function mockCouncilResponse(taskId) {
  return JSON.stringify({
    taskId,
    inputSummary: "Summarized current input.",
    proposedChange: "Apply the next controlled improvement.",
    filesAffected: ["src/example.js"],
    confidence: {
      score: "medium",
      reason: "Satisfies baseline constraints."
    },
    evidence: ["Model output validated with schema checks."],
    validationRequirement: "Run targeted checks before accept.",
    risks: ["May require minor prompt tuning."],
    unknowns: ["Final integration side effects."],
    testPlan: ["Run focused council regression test."]
  });
}

test("council enters minimal mode after high prior dispatch failure rate", async () => {
  const rootDir = makeTempRoot();

  recordCouncilRun(rootDir, {
    id: "COUNCIL-PRIOR",
    createdAt: new Date().toISOString(),
    taskType: "analysis",
    taskId: "TASK-PRIOR",
    runs: [
      { role: "builder", issues: ["dispatch_failure"] },
      { role: "qa", issues: ["dispatch_failure"] },
      { role: "security", issues: ["dispatch_failure"] },
      { role: "architect", issues: [] }
    ],
    summary: {
      dispatchFailureRate: 0.75
    }
  });

  const fetchImpl = async (url) => {
    if (String(url).endsWith("/models")) {
      return new Response(JSON.stringify({
        data: [{ id: "nvidia/worker-model" }]
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    if (String(url).endsWith("/chat/completions")) {
      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: mockCouncilResponse("TASK-123")
            }
          }
        ],
        usage: {
          total_tokens: 120
        }
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  const result = await runNvidiaWorkerCouncil({
    rootDir,
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "nvapi-test-key",
    taskType: "analysis",
    taskId: "TASK-123",
    messages: [
      { role: "user", content: "Analyze and plan." }
    ],
    fetchImpl
  });

  assert.equal(result.ok, true);
  assert.equal(result.councilRun.routingMode, "minimal");
  assert.deepEqual(
    result.routes.map((route) => route.role),
    ["builder"]
  );
  assert.equal(result.summary.decisionTrace[0].mode, "minimal");
  assert.equal(result.summary.decisionTrace[0].dispatchFailureRate, 0.75);
  assert.equal(
    String(result.summary.decisionTrace[0].reason).includes("exceeded 50%"),
    true
  );
});
