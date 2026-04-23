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

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mztek-"));
  initProject(root, "Fixture");
  return root;
}

test("init creates a usable mztek workspace", () => {
  const root = makeTempProject();
  const projectDir = path.join(root, ".mztek");
  assert.equal(fs.existsSync(projectDir), true);
  assert.equal(fs.existsSync(path.join(projectDir, "project.json")), true);
  assert.equal(fs.existsSync(path.join(projectDir, "tasks.json")), true);
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
  assert.equal(fs.existsSync(path.join(root, ".mztek", "benchmark-pack.json")), true);
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
  assert.equal(report.includes("Tests: 17/17"), true);
});

test("pulse output gives a compact project update", () => {
  const status = loadLiveStatus("E:/MZTEK");
  const pulse = formatPulse(status);

  assert.equal(pulse.includes("Project Pulse: MZTEK"), true);
  assert.equal(pulse.includes("Latest Gain:"), true);
  assert.equal(pulse.includes("Next Move:"), true);
});
