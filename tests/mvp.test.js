import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { initProject, loadProjectState, saveProjectState } from "../src/fs-store.js";
import { createTask, claimTaskDone, addEvidence, addDecision } from "../src/tasks.js";
import { validateProject } from "../src/validator.js";
import { evaluateFixture, loadFixture } from "../src/fixture-evaluator.js";
import { availableSamples, seedFromSample } from "../src/sample-loader.js";
import { formatProjectReport } from "../src/report.js";
import { formatLiveStatus, formatPulse, loadLiveStatus } from "../src/live-tracker.js";
import { buildGoogleAuthorizationUrl, createPkcePair } from "../src/google-auth.js";
import { createApiServer } from "../src/mztek-api.js";
import { buildDashboardData } from "../src/dashboard-data.js";
import { createDashboardServer } from "../src/dashboard-server.js";
import { publicConnectionState } from "../src/connection-store.js";
import { latestPromptRuns, recordPromptRun } from "../src/prompt-ledger.js";
import { latestQaReviews, recordQaReview } from "../src/review-ledger.js";

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mztek-"));
  initProject(root, "Fixture");
  return root;
}

test("init creates a usable mztek workspace", () => {
  const root = makeTempProject();
  const projectDir = path.join(root, ".mztek");
  const runtimeDir = path.join(projectDir, "runtime");
  assert.equal(fs.existsSync(projectDir), true);
  assert.equal(fs.existsSync(runtimeDir), true);
  assert.equal(fs.existsSync(path.join(runtimeDir, "project.json")), true);
  assert.equal(fs.existsSync(path.join(runtimeDir, "tasks.json")), true);
});

test("validator catches fake done with missing evidence", () => {
  const root = makeTempProject();
  const state = loadProjectState(root);
  const task = createTask(state, {
    title: "Build auth flow",
    requiredEvidence: ["test", "review"]
  });
  claimTaskDone(state, task.id);

  const result = validateProject(state);
  assert.equal(result.ok, false);
  assert.equal(result.run.summary.critical, 1);
  assert.equal(state.tasks.items[0].status, "needs_validation");
});

test("validator marks task done when dependencies and proof exist", () => {
  const root = makeTempProject();
  const state = loadProjectState(root);

  const base = createTask(state, {
    title: "Create API route",
    requiredEvidence: ["test"]
  });
  addEvidence(state, base.id, { type: "test", detail: "API test passed" });
  claimTaskDone(state, base.id);
  validateProject(state);

  const dependent = createTask(state, {
    title: "Wire login UI",
    dependencies: [base.id],
    requiredEvidence: ["review"]
  });
  addEvidence(state, dependent.id, { type: "review", detail: "Reviewed by QA" });
  claimTaskDone(state, dependent.id);

  const result = validateProject(state);
  assert.equal(result.ok, true);
  assert.equal(state.tasks.items[1].verifiedDone, true);
  assert.equal(state.tasks.items[1].status, "done");
});

test("decision logging persists with the project state", () => {
  const root = makeTempProject();
  const state = loadProjectState(root);
  addDecision(state, "Use notebook-first workflow", "Improves resumability");
  saveProjectState(root, state);

  const reloaded = loadProjectState(root);
  assert.equal(reloaded.decisions.items.length, 1);
  assert.equal(reloaded.decisions.items[0].summary, "Use notebook-first workflow");
});

test("prompt ledger persists prompt attempts", () => {
  const root = makeTempProject();
  const state = loadProjectState(root);
  const task = createTask(state, {
    title: "Build governed prompt flow"
  });

  const record = recordPromptRun(state, {
    taskId: task.id,
    userIntent: "Build auth flow",
    governedPrompt: "Implement backend contract first and return proof.",
    target: "windsurf",
    expectedOutcome: "Verified signup contract",
    responseSummary: "Frontend scaffold created, backend assumed.",
    outcome: "partial",
    evidenceQuality: "weak",
    critique: "Prompt allowed backend assumptions.",
    nextPromptStrategy: "Narrow to backend contract and require runtime proof."
  });
  saveProjectState(root, state);

  const reloaded = loadProjectState(root);
  const entries = latestPromptRuns(reloaded, 5);

  assert.equal(record.id, "PROMPT-001");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].critique, "Prompt allowed backend assumptions.");
  assert.equal(entries[0].taskId, task.id);
});

test("qa review ledger persists side-by-side critique", () => {
  const root = makeTempProject();
  const state = loadProjectState(root);
  const task = createTask(state, {
    title: "Build governed prompt flow"
  });
  const prompt = recordPromptRun(state, {
    taskId: task.id,
    userIntent: "Build auth flow",
    governedPrompt: "Implement backend contract first and return proof.",
    target: "windsurf",
    expectedOutcome: "Verified signup contract"
  });

  const review = recordQaReview(state, {
    promptId: prompt.id,
    taskId: task.id,
    reviewer: "qa-sidecar",
    severity: "high",
    failureClass: "constraint_drift",
    critique: "Builder ignored required proof path.",
    evidenceGap: "No runtime proof attached.",
    recommendedAction: "Retry with a narrower evidence contract.",
    sourceType: "qa-agent"
  });
  saveProjectState(root, state);

  const reloaded = loadProjectState(root);
  const entries = latestQaReviews(reloaded, 5);

  assert.equal(review.id, "REVIEW-001");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].promptId, prompt.id);
  assert.equal(entries[0].critique, "Builder ignored required proof path.");
});

test("fixture evaluator flags fake done scenarios as suspicious", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/fake-done-dashboard-widget.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "suspicious");
  assert.equal(result.severity, "high");
  assert.equal(result.missing_dependencies.includes("GET /api/admin/revenue-summary"), true);
  assert.equal(result.missing_proof.length > 0, true);
});

test("fixture evaluator blocks missing dependency scenarios", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/missing-dependency-signup-flow.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "blocked");
  assert.equal(result.severity, "critical");
  assert.equal(result.missing_dependencies.includes("POST /api/auth/signup"), true);
});

test("fixture evaluator accepts verified completion scenarios", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/verified-completion-pricing-page.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "validated");
  assert.equal(result.severity, "low");
  assert.deepEqual(result.missing_dependencies, []);
});

test("career mantra human-in-loop gap stays suspicious under zero-trust review", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/career-mantra-human-in-loop-gap.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "suspicious");
  assert.equal(result.severity, "high");
  assert.equal(result.missing_dependencies.includes("human approval gate"), true);
});

test("career mantra privacy claim gap is blocked as a critical risk", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/career-mantra-privacy-claim-gap.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "blocked");
  assert.equal(result.severity, "critical");
  assert.equal(result.missing_dependencies.includes("local inference path"), true);
});

test("career mantra job discovery verified scenario is accepted", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/career-mantra-job-discovery-verified.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "validated");
  assert.equal(result.severity, "low");
});

test("career mantra audit trail gap is treated as suspicious", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/career-mantra-audit-trail-gap.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "suspicious");
  assert.equal(result.severity, "high");
});

test("career mantra CV truthfulness gap is blocked as critical", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/career-mantra-cv-truthfulness-gap.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "blocked");
  assert.equal(result.severity, "critical");
});

test("career mantra status protocol gap is treated as suspicious", () => {
  const fixture = loadFixture("E:/MZTEK/tests/fixtures/career-mantra-status-protocol-gap.json");
  const result = evaluateFixture(fixture);

  assert.equal(result.status, "suspicious");
  assert.equal(result.severity, "high");
});

test("sample registry exposes career mantra", () => {
  const samples = availableSamples("E:/MZTEK");
  assert.equal(samples.includes("career-mantra"), true);
});

test("career mantra sample can seed a governed project", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mztek-sample-"));
  seedFromSample("E:/MZTEK", "career-mantra", root);
  const state = loadProjectState(root);

  assert.equal(state.project.name, "Career Mantra OS");
  assert.equal(state.project.benchmarkPack, "career-mantra-os");
  assert.equal(state.tasks.items.length >= 4, true);
  assert.equal(state.decisions.items.length, 3);
  assert.equal(fs.existsSync(path.join(root, ".mztek", "runtime", "benchmark-pack.json")), true);
  assert.equal(state.benchmarkPack.name, "Career Mantra OS Benchmark Pack");
});

test("benchmark-aware validation reports missing benchmark checkpoints", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mztek-benchmark-"));
  seedFromSample("E:/MZTEK", "career-mantra", root);
  const state = loadProjectState(root);
  const result = validateProject(state);

  assert.equal(result.run.benchmark.applicable, true);
  assert.equal(result.run.benchmark.summary.missing > 0, true);
  assert.equal(result.run.issues.some((issue) => issue.type === "missing_benchmark_checkpoint"), true);
});

test("project report surfaces benchmark and task truth", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mztek-report-"));
  seedFromSample("E:/MZTEK", "career-mantra", root);
  const state = loadProjectState(root);
  const result = validateProject(state);
  saveProjectState(root, state);

  const report = formatProjectReport(state);
  assert.equal(report.includes("Career Mantra OS"), true);
  assert.equal(report.includes("Benchmark Pack: career-mantra-os"), true);
  assert.equal(report.includes("Task Totals:"), true);
});

test("live tracker exposes current work clearly", () => {
  const status = loadLiveStatus("E:/MZTEK");
  const report = formatLiveStatus(status);

  assert.equal(report.includes("Project: MZTEK"), true);
  assert.equal(report.includes("Current Task:"), true);
  assert.equal(report.includes("Pending Next:"), true);
  assert.equal(report.includes("Tests: 25/25"), true);
  assert.equal(report.includes("Prompt ledger foundation added"), true);
});

test("pulse output gives a compact project update", () => {
  const status = loadLiveStatus("E:/MZTEK");
  const pulse = formatPulse(status);

  assert.equal(pulse.includes("Project Pulse: MZTEK"), true);
  assert.equal(pulse.includes("Latest Gain:"), true);
  assert.equal(pulse.includes("Next Move:"), true);
});

test("google auth URL is built with expected params", () => {
  const url = new URL(
    buildGoogleAuthorizationUrl({
      clientId: "client-123",
      redirectUri: "http://localhost:4317/auth/google/callback",
      state: "state-abc",
      codeChallenge: "challenge-xyz"
    })
  );

  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), "client-123");
  assert.equal(url.searchParams.get("state"), "state-abc");
  assert.equal(url.searchParams.get("code_challenge"), "challenge-xyz");
  assert.equal(url.searchParams.get("response_type"), "code");
});

test("pkce pair provides verifier and challenge", () => {
  const pair = createPkcePair();

  assert.equal(typeof pair.verifier, "string");
  assert.equal(typeof pair.challenge, "string");
  assert.equal(pair.verifier.length > 20, true);
  assert.equal(pair.challenge.length > 20, true);
  assert.equal(pair.method, "S256");
});

test("api server reports google auth misconfiguration clearly", async () => {
  const server = createApiServer({
    env: {
      MZTEK_GOOGLE_CLIENT_ID: "",
      MZTEK_GOOGLE_CLIENT_SECRET: "",
      MZTEK_GOOGLE_REDIRECT_URI: "http://localhost:4317/auth/google/callback"
    }
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/auth/google/start`, {
    redirect: "manual"
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 500);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.includes("Google OAuth is not configured"), true);
});

test("dashboard data includes decision trace and validation", () => {
  const root = makeTempProject();
  const state = loadProjectState(root);
  const task = createTask(state, {
    title: "Build auth flow"
  });
  recordPromptRun(state, {
    taskId: task.id,
    userIntent: "Build auth flow",
    governedPrompt: "Implement contract first.",
    target: "cursor",
    expectedOutcome: "Verified backend contract",
    outcome: "partial",
    evidenceQuality: "weak",
    critique: "Prompt needs stronger dependency constraints.",
    nextPromptStrategy: "Add proof requirements and backend-first scope."
  });
  recordQaReview(state, {
    promptId: "PROMPT-001",
    taskId: task.id,
    reviewer: "qa-sidecar",
    severity: "high",
    failureClass: "constraint_drift",
    critique: "QA sees weak evidence for the claimed step.",
    recommendedAction: "Require runtime proof before acceptance.",
    sourceType: "qa-agent"
  });
  saveProjectState(root, state);

  const data = buildDashboardData(root, "E:/MZTEK");

  assert.equal(data.project.name, "Fixture");
  assert.equal(Array.isArray(data.taskBoard.tasks), true);
  assert.equal(typeof data.decisionTrace.goal, "string");
  assert.equal(Array.isArray(data.decisionTrace.principles), true);
  assert.equal(Array.isArray(data.decisionTrace.provenance), true);
  assert.equal(data.promptLedger.length, 1);
  assert.equal(data.qaLedger.length, 1);
  assert.equal(Array.isArray(data.decisionLog), true);
  assert.equal(Array.isArray(data.integrations), true);
  assert.equal(data.boardColumns[0].title, "Intake");
  assert.equal(typeof data.controller.currentStep, "string");
  assert.equal(typeof data.controller.nextAction, "string");
  assert.equal(typeof data.onboarding.prompt, "string");
  assert.equal(typeof data.teamBriefing.title, "string");
  assert.equal(data.decisionTrace.latest_prompt_critique, "Prompt needs stronger dependency constraints.");
  assert.equal(data.decisionTrace.latest_qa_critique, "QA sees weak evidence for the claimed step.");
  assert.equal(data.liveContext.projectScoped, false);
  assert.equal(data.latestValidation.score >= 0, true);
});

test("dashboard server exposes data and html", async () => {
  const server = createDashboardServer({
    projectDir: "E:/MZTEK/sandboxes/career-mantra",
    workspaceRoot: "E:/MZTEK"
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const htmlResponse = await fetch(`http://127.0.0.1:${port}/`);
  const html = await htmlResponse.text();
  const apiResponse = await fetch(`http://127.0.0.1:${port}/api/dashboard`);
  const apiPayload = await apiResponse.json();
  server.close();

  assert.equal(htmlResponse.status, 200);
  assert.equal(html.includes("MZTEK Control Room"), true);
  assert.equal(html.includes("Project Switcher"), true);
  assert.equal(html.includes("Analyze project first"), true);
  assert.equal(html.includes("Integrations Panel"), true);
  assert.equal(html.includes("Decision Log"), true);
  assert.equal(html.includes("Current Step"), true);
  assert.equal(html.includes("Next Action"), true);
  assert.equal(html.includes("Onboarding Flow"), true);
  assert.equal(html.includes("MZTEK Team Briefing"), true);
  assert.equal(html.includes("Work Board"), true);
  assert.equal(html.includes("Activity + Decisions"), true);
  assert.equal(html.includes("Builder Communication"), true);
  assert.equal(html.includes("QA Communication"), true);
  assert.equal(apiResponse.status, 200);
  assert.equal(apiPayload.project.name, "Career Mantra OS");
});

test("dashboard server switches projects from query string", async () => {
  const server = createDashboardServer({
    projectDir: "E:/MZTEK/sandboxes/career-mantra",
    workspaceRoot: "E:/MZTEK"
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/dashboard?project=mztek`);
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 200);
  assert.equal(payload.selectedProjectKey, "mztek");
  assert.equal(payload.selectedProjectDir, "E:/MZTEK");
});

test("dashboard nvidia route falls back to mock mode without API key", async () => {
  const root = makeTempProject();
  const server = createDashboardServer({
    projectDir: root,
    workspaceRoot: root,
    env: {
      NVIDIA_API_KEY: "",
      NVIDIA_BASE_URL: "https://integrate.api.nvidia.com/v1",
      NVIDIA_DEFAULT_MODEL: ""
    }
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/nvidia-chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      message: "Build an internal dashboard for MZTEK",
      fileNames: ["spec.md"],
      links: {
        github: "https://github.com/example/repo"
      }
    })
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.provider, "mock");
  assert.equal(Array.isArray(payload.result.tasks), true);
  assert.equal(payload.result.tasks.length > 0, true);
});

test("dashboard analyze-project route returns project understanding", async () => {
  const server = createDashboardServer({
    projectDir: "E:/MZTEK",
    workspaceRoot: "E:/MZTEK"
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/analyze-project`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      projectDir: "E:/MZTEK",
      fileNames: ["brief.pdf"],
      links: {
        github: "https://github.com/example/mztek",
        website: "https://example.com"
      }
    })
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.analysis.projectDir, "E:/MZTEK");
  assert.equal(Array.isArray(payload.analysis.detectedStack), true);
  assert.equal(Array.isArray(payload.analysis.tasks), true);
  assert.equal(Array.isArray(payload.analysis.decisions), true);
  assert.equal(Array.isArray(payload.integrations), true);
  assert.equal(typeof payload.controller.currentStep, "string");
  assert.equal(typeof payload.teamBriefing.title, "string");
  assert.equal(Array.isArray(payload.teamBriefing.integrationStatus), true);
});

test("github connect validates bad URL clearly", async () => {
  const server = createDashboardServer({
    projectDir: "E:/MZTEK",
    workspaceRoot: "E:/MZTEK"
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/github/connect`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ repoUrl: "not-a-url" })
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(String(payload.error).includes("Invalid GitHub repository URL"), true);
});

test("github connect reports missing OAuth config clearly", async () => {
  const server = createDashboardServer({
    projectDir: "E:/MZTEK",
    workspaceRoot: "E:/MZTEK",
    env: {}
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/github/connect`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ repoUrl: "https://github.com/example/repo" })
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(String(payload.error).includes("GitHub OAuth is not configured"), true);
});

test("github device flow can connect and validate through official endpoints", async () => {
  const root = makeTempProject();
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url === "https://github.com/login/device/code") {
      return new Response(JSON.stringify({
        device_code: "device-code-123",
        user_code: "ABCD-EFGH",
        verification_uri: "https://github.com/login/device",
        interval: 1,
        expires_in: 900
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url === "https://github.com/login/oauth/access_token") {
      return new Response(JSON.stringify({
        access_token: "stub"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url === "https://api.github.com/user") {
      return new Response(JSON.stringify({
        login: "mztek-user",
        html_url: "https://github.com/mztek-user"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url === "https://api.github.com/repos/example/repo") {
      return new Response(JSON.stringify({
        full_name: "example/repo",
        name: "repo",
        default_branch: "main",
        html_url: "https://github.com/example/repo",
        private: false,
        owner: { login: "example" },
        permissions: { pull: true, push: true, admin: false }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }

    throw new Error(`Unexpected GitHub fetch: ${url}`);
  };

  const server = createDashboardServer({
    projectDir: root,
    workspaceRoot: root,
    env: {
      MZTEK_GITHUB_CLIENT_ID: "github-client-id"
    },
    fetchImpl
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const startResponse = await fetch(`http://127.0.0.1:${port}/api/github/connect`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ repoUrl: "https://github.com/example/repo" })
  });
  const startPayload = await startResponse.json();

  const pollResponse = await fetch(`http://127.0.0.1:${port}/api/github/poll`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  const pollPayload = await pollResponse.json();

  server.close();

  assert.equal(startResponse.status, 200);
  assert.equal(startPayload.ok, true);
  assert.equal(startPayload.deviceFlow.userCode, "ABCD-EFGH");
  assert.equal(pollResponse.status, 200);
  assert.equal(pollPayload.ok, true);
  assert.equal(pollPayload.pending, false);
  assert.equal(publicConnectionState(root).github.connected, true);
  assert.equal(publicConnectionState(root).github.username, "mztek-user");

  const secureBlob = fs.readFileSync(path.join(root, ".mztek", "secure", "connections.enc.json"), "utf8");
  assert.equal(secureBlob.includes("gho_test_secret_value"), false);
  assert.equal(secureBlob.includes("mztek-user"), false);
  assert.equal(calls.length >= 4, true);
});

test("nvidia validate returns clear mock-mode error", async () => {
  const root = makeTempProject();
  const server = createDashboardServer({
    projectDir: root,
    workspaceRoot: root,
    env: {
      NVIDIA_API_KEY: "",
      NVIDIA_BASE_URL: "https://integrate.api.nvidia.com/v1",
      NVIDIA_DEFAULT_MODEL: ""
    }
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/nvidia/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(String(payload.error).includes("NVIDIA is not connected"), true);
});

test("nvidia validate stores a connected key without exposing the secret", async () => {
  const root = makeTempProject();
  const fetchImpl = async (url) => {
    if (url === "https://integrate.api.nvidia.com/v1/models") {
      return new Response(JSON.stringify({
        data: [
          { id: "meta/llama-3.1-70b-instruct" },
          { id: "mistralai/mixtral-8x7b-instruct-v0.1" }
        ]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`Unexpected NVIDIA fetch: ${url}`);
  };

  const server = createDashboardServer({
    projectDir: root,
    workspaceRoot: root,
    fetchImpl
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/nvidia/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey: "nvapi-test-secret",
      baseUrl: "https://integrate.api.nvidia.com/v1"
    })
  });
  const payload = await response.json();
  server.close();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.providerStatus.validationStatus, "pass");
  assert.equal(publicConnectionState(root).nvidia.connected, true);
  assert.equal(publicConnectionState(root).nvidia.availableModels.length, 2);

  const secureBlob = fs.readFileSync(path.join(root, ".mztek", "secure", "connections.enc.json"), "utf8");
  assert.equal(secureBlob.includes("nvapi-test-secret"), false);
});
