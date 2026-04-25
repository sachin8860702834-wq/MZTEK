import fs from "node:fs";
import path from "node:path";
import {
  FILES,
  MZTEK_DIR,
  MZTEK_RUNTIME_DIR,
  MZTEK_LOGS_DIR,
  MZTEK_CONFIG_DIR,
  MZTEK_TEMPLATES_DIR,
  DEFAULT_PROJECT,
  DEFAULT_TASKS,
  DEFAULT_DECISIONS,
  DEFAULT_PROMPTS,
  DEFAULT_REVIEWS,
  DEFAULT_VALIDATIONS
} from "./constants.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function resolveRoot(targetDir = process.cwd()) {
  return path.resolve(targetDir);
}

export function mztekPath(rootDir, fileName = "") {
  return path.join(resolveRoot(rootDir), MZTEK_DIR, fileName);
}

export function runtimePath(rootDir, fileName = "") {
  return mztekPath(rootDir, path.join(MZTEK_RUNTIME_DIR, fileName));
}

function legacyStatePath(rootDir, fileName = "") {
  return mztekPath(rootDir, fileName);
}

export function projectExists(rootDir) {
  return fs.existsSync(mztekPath(rootDir));
}

export function ensureProject(rootDir) {
  if (!projectExists(rootDir)) {
    throw new Error(`No ${MZTEK_DIR} project found in ${resolveRoot(rootDir)}. Run "mztek init" there first or pass --project=PATH.`);
  }
}

export function initProject(rootDir, projectName) {
  const root = resolveRoot(rootDir);
  fs.mkdirSync(mztekPath(root), { recursive: true });
  fs.mkdirSync(runtimePath(root), { recursive: true });
  fs.mkdirSync(mztekPath(root, MZTEK_LOGS_DIR), { recursive: true });
  fs.mkdirSync(mztekPath(root, MZTEK_CONFIG_DIR), { recursive: true });
  fs.mkdirSync(mztekPath(root, MZTEK_TEMPLATES_DIR), { recursive: true });

  const timestamp = new Date().toISOString();
  const project = clone(DEFAULT_PROJECT);
  project.name = projectName || path.basename(root);
  project.createdAt = timestamp;
  project.updatedAt = timestamp;

  writeJson(root, FILES.project, project);
  writeJson(root, FILES.tasks, clone(DEFAULT_TASKS));
  writeJson(root, FILES.decisions, clone(DEFAULT_DECISIONS));
  writeJson(root, FILES.prompts, clone(DEFAULT_PROMPTS));
  writeJson(root, FILES.reviews, clone(DEFAULT_REVIEWS));
  writeJson(root, FILES.validations, clone(DEFAULT_VALIDATIONS));
}

export function readJson(rootDir, fileName, fallback) {
  ensureProject(rootDir);
  const filePath = runtimePath(rootDir, fileName);

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const legacyPath = legacyStatePath(rootDir, fileName);
  if (fs.existsSync(legacyPath)) {
    return JSON.parse(fs.readFileSync(legacyPath, "utf8"));
  }

  return clone(fallback);
}

export function writeJson(rootDir, fileName, value) {
  const filePath = runtimePath(rootDir, fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function loadProjectState(rootDir) {
  return {
    project: readJson(rootDir, FILES.project, DEFAULT_PROJECT),
    tasks: readJson(rootDir, FILES.tasks, DEFAULT_TASKS),
    decisions: readJson(rootDir, FILES.decisions, DEFAULT_DECISIONS),
    prompts: readJson(rootDir, FILES.prompts, DEFAULT_PROMPTS),
    reviews: readJson(rootDir, FILES.reviews, DEFAULT_REVIEWS),
    validations: readJson(rootDir, FILES.validations, DEFAULT_VALIDATIONS),
    benchmarkPack: readJson(rootDir, FILES.benchmarkPack, null),
    sampleContext: readJson(rootDir, FILES.sampleContext, null)
  };
}

export function saveProjectState(rootDir, state) {
  writeJson(rootDir, FILES.project, state.project);
  writeJson(rootDir, FILES.tasks, state.tasks);
  writeJson(rootDir, FILES.decisions, state.decisions);
  writeJson(rootDir, FILES.prompts, state.prompts);
  writeJson(rootDir, FILES.reviews, state.reviews);
  writeJson(rootDir, FILES.validations, state.validations);
  if (state.benchmarkPack) {
    writeJson(rootDir, FILES.benchmarkPack, state.benchmarkPack);
  }
  if (state.sampleContext) {
    writeJson(rootDir, FILES.sampleContext, state.sampleContext);
  }
}
