export const MZTEK_DIR = ".mztek";
export const MZTEK_RUNTIME_DIR = "runtime";
export const MZTEK_LOGS_DIR = "logs";
export const MZTEK_CONFIG_DIR = "config";
export const MZTEK_TEMPLATES_DIR = "templates";

export const FILES = {
  project: "project.json",
  tasks: "tasks.json",
  decisions: "decisions.json",
  prompts: "prompts.json",
  reviews: "reviews.json",
  validations: "validations.json",
  benchmarkPack: "benchmark-pack.json",
  sampleContext: "sample-context.json"
};

export const DEFAULT_PROJECT = {
  name: "Unnamed Project",
  createdAt: "",
  updatedAt: "",
  currentPhase: "planning",
  summary: "",
  status: "active",
  principles: [
    "Plan broadly, build incrementally.",
    "Trust nothing without proof.",
    "Document as you build."
  ]
};

export const DEFAULT_TASKS = {
  nextId: 1,
  items: []
};

export const DEFAULT_DECISIONS = {
  items: []
};

export const DEFAULT_PROMPTS = {
  nextId: 1,
  items: []
};

export const DEFAULT_REVIEWS = {
  nextId: 1,
  items: []
};

export const DEFAULT_VALIDATIONS = {
  runs: []
};
