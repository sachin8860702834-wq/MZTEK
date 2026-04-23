import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initProject, loadProjectState, mztekPath, saveProjectState, writeJson } from "./fs-store.js";
import { addDecision, createTask } from "./tasks.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function availableSamples(rootDir) {
  const samplesDir = path.join(rootDir, "samples");
  if (!fs.existsSync(samplesDir)) {
    return [];
  }

  return fs.readdirSync(samplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function workspaceRootFromModule() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function seedFromSample(workspaceRoot, sampleName, targetDir) {
  const sampleDir = path.join(workspaceRoot, "samples", sampleName);
  const seedPath = path.join(sampleDir, "seed.json");
  const projectPath = path.join(sampleDir, "project.json");

  if (!fs.existsSync(seedPath) || !fs.existsSync(projectPath)) {
    throw new Error(`Sample "${sampleName}" is incomplete. Expected seed.json and project.json.`);
  }

  if (!fs.existsSync(mztekPath(targetDir))) {
    initProject(targetDir, sampleName);
  }

  const seed = readJson(seedPath);
  const projectData = readJson(projectPath);
  const benchmarkPack = readJson(path.join(workspaceRoot, "library", "benchmark-packs", `${seed.benchmarkPack}.json`));
  const state = loadProjectState(targetDir);

  state.project.name = seed.project.name;
  state.project.currentPhase = seed.project.currentPhase;
  state.project.summary = seed.project.summary;
  state.project.status = seed.project.status;
  state.project.updatedAt = new Date().toISOString();
  state.project.sampleProject = sampleName;
  state.project.productType = projectData.type;
  state.project.region = projectData.region;
  state.project.benchmarkPack = seed.benchmarkPack;

  state.tasks = { nextId: 1, items: [] };
  state.decisions = { items: [] };
  state.validations = { runs: [] };

  for (const task of seed.tasks) {
    createTask(state, task);
  }

  for (const decision of seed.decisions) {
    addDecision(state, decision.summary, decision.rationale);
  }

  saveProjectState(targetDir, state);
  writeJson(targetDir, "sample-context.json", projectData);
  writeJson(targetDir, "benchmark-pack.json", benchmarkPack);

  return state;
}
