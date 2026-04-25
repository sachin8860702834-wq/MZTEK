export type AppPageKey =
  | "dashboard"
  | "tasks"
  | "validation"
  | "agents"
  | "decisions"
  | "activity"
  | "integrations"
  | "settings";

export type TaskStatus = "Todo" | "In Progress" | "Blocked" | "Done";
export type ValidationStatus = "PASS" | "FAIL" | "WARN";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  evidenceCount: number;
  validationStatus: ValidationStatus;
  qaFeedback: string;
  dependencies: string[];
  owner: string;
  updatedAt: string;
};

export type ValidationRun = {
  id: string;
  title: string;
  status: ValidationStatus;
  checks: string[];
  failureReasons: string[];
  ranAt: string;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: "active" | "waiting" | "blocked";
  currentTask: string;
  lastOutput: string;
};

export type Decision = {
  id: string;
  title: string;
  reason: string;
  impact: string;
  changed: string;
  at: string;
};

export type ActivityEvent = {
  id: string;
  title: string;
  detail: string;
  kind: "task" | "validation" | "integration" | "decision" | "agent";
  at: string;
};

export type IntegrationState = {
  id: string;
  label: string;
  status: "Connected" | "Not connected";
  detail: string;
};

export const appNav = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "tasks", label: "Tasks", href: "/tasks" },
  { key: "validation", label: "Validation", href: "/validation" },
  { key: "agents", label: "Agents", href: "/agents" },
  { key: "decisions", label: "Decisions", href: "/decisions" },
  { key: "activity", label: "Activity", href: "/activity" },
  { key: "integrations", label: "Integrations", href: "/integrations" },
  { key: "settings", label: "Settings", href: "/settings" }
] as const;

export const tasks: Task[] = [
  {
    id: "TASK-101",
    title: "Wire GitHub repo context into project analysis",
    description: "Use connected repository metadata during MZTEK understanding and planning flows.",
    status: "In Progress",
    evidenceCount: 3,
    validationStatus: "WARN",
    qaFeedback: "Repo status is visible, but analysis still needs live metadata usage.",
    dependencies: ["INT-201"],
    owner: "Codex",
    updatedAt: "5 min ago"
  },
  {
    id: "TASK-102",
    title: "Upgrade Control Room to human-first navigation",
    description: "Reduce clutter and organize widgets into clear overview, work, and insight surfaces.",
    status: "Todo",
    evidenceCount: 1,
    validationStatus: "PASS",
    qaFeedback: "Ready to start once the layout structure is approved.",
    dependencies: [],
    owner: "Codex",
    updatedAt: "12 min ago"
  },
  {
    id: "TASK-103",
    title: "Stabilize validation messaging",
    description: "Align failed runs, blocker widgets, and QA feedback under one language model.",
    status: "Blocked",
    evidenceCount: 4,
    validationStatus: "FAIL",
    qaFeedback: "Blocked because failure reasons are scattered across pages.",
    dependencies: ["VAL-302"],
    owner: "QA Sidecar",
    updatedAt: "22 min ago"
  },
  {
    id: "TASK-104",
    title: "Finalize NVIDIA live planning route",
    description: "Use the connected NVIDIA model for planning flows instead of mock mode.",
    status: "Done",
    evidenceCount: 6,
    validationStatus: "PASS",
    qaFeedback: "Connected and validated successfully.",
    dependencies: ["INT-202"],
    owner: "Codex",
    updatedAt: "31 min ago"
  },
  {
    id: "TASK-105",
    title: "Design task detail drill-down experience",
    description: "Make evidence, QA, dependencies, and validation easy to review from one task page.",
    status: "Todo",
    evidenceCount: 0,
    validationStatus: "WARN",
    qaFeedback: "Awaiting final UI direction.",
    dependencies: [],
    owner: "Design",
    updatedAt: "45 min ago"
  }
];

export const validationRuns: ValidationRun[] = [
  {
    id: "VAL-401",
    title: "Dashboard interaction validation",
    status: "PASS",
    checks: ["Sidebar navigation", "Task links", "Detail routes", "Widget links"],
    failureReasons: [],
    ranAt: "2 min ago"
  },
  {
    id: "VAL-302",
    title: "Control Room wording consistency",
    status: "FAIL",
    checks: ["Current step messaging", "Blocker labels", "Quick action copy"],
    failureReasons: ["Validation and blocker language still differ across sections."],
    ranAt: "18 min ago"
  },
  {
    id: "VAL-287",
    title: "Integration status surface",
    status: "WARN",
    checks: ["GitHub card", "NVIDIA card", "Settings copy"],
    failureReasons: ["GitHub setup explanation still feels technical."],
    ranAt: "34 min ago"
  }
];

export const agents: Agent[] = [
  {
    id: "AGENT-1",
    name: "Codex",
    role: "Builder / Architect",
    status: "active",
    currentTask: "Planning the new production dashboard shell",
    lastOutput: "Created navigation, task board, and overview layout."
  },
  {
    id: "AGENT-2",
    name: "QA Sidecar",
    role: "Reviewer",
    status: "active",
    currentTask: "Reviewing clarity of blocker and validation states",
    lastOutput: "Flagged that validation wording still feels too technical."
  },
  {
    id: "AGENT-3",
    name: "NVIDIA Planner",
    role: "Planning Provider",
    status: "waiting",
    currentTask: "Ready for the next real planning request",
    lastOutput: "Last successful model selection: 01-ai/yi-large."
  }
];

export const decisions: Decision[] = [
  {
    id: "DEC-1",
    title: "Separate overview from execution detail",
    reason: "The original dashboard overloaded the first screen with equal-weight panels.",
    impact: "The dashboard now starts with status, blockers, tasks, and recent decisions.",
    changed: "Moved deep detail into dedicated pages.",
    at: "9 min ago"
  },
  {
    id: "DEC-2",
    title: "Use page-based navigation instead of one long dashboard",
    reason: "Humans need stable places for tasks, validation, agents, and integrations.",
    impact: "Each domain now has a dedicated screen with drill-down links.",
    changed: "Sidebar added for permanent navigation.",
    at: "16 min ago"
  },
  {
    id: "DEC-3",
    title: "Keep live insights visible on every screen",
    reason: "Quick awareness should not require returning to the home page.",
    impact: "Right rail now shows current task, last validation, alerts, and quick actions.",
    changed: "Live widget rail added to layout.",
    at: "27 min ago"
  }
];

export const activity: ActivityEvent[] = [
  {
    id: "ACT-1",
    title: "Task created",
    detail: "TASK-102 was created to redesign the dashboard for human use.",
    kind: "task",
    at: "7 min ago"
  },
  {
    id: "ACT-2",
    title: "Validation failed",
    detail: "VAL-302 failed due to inconsistent validation wording.",
    kind: "validation",
    at: "18 min ago"
  },
  {
    id: "ACT-3",
    title: "GitHub connected",
    detail: "Repo access was verified for sachin8860702834-wq/MZTEK.",
    kind: "integration",
    at: "28 min ago"
  },
  {
    id: "ACT-4",
    title: "Decision recorded",
    detail: "Navigation was split into dashboard, tasks, validation, agents, decisions, activity, integrations, and settings.",
    kind: "decision",
    at: "33 min ago"
  },
  {
    id: "ACT-5",
    title: "Agent update",
    detail: "QA Sidecar marked blocker messaging as the main clarity issue.",
    kind: "agent",
    at: "41 min ago"
  }
];

export const integrations: IntegrationState[] = [
  {
    id: "INT-201",
    label: "GitHub",
    status: "Connected",
    detail: "Connected as sachin8860702834-wq with admin access to MZTEK."
  },
  {
    id: "INT-202",
    label: "NVIDIA",
    status: "Connected",
    detail: "Validated against /v1/models with active model 01-ai/yi-large."
  }
];

export const overview = {
  activeTasks: tasks.filter((task) => task.status === "In Progress").length,
  completedTasks: tasks.filter((task) => task.status === "Done").length,
  blockedTasks: tasks.filter((task) => task.status === "Blocked").length,
  validationPasses: validationRuns.filter((run) => run.status === "PASS").length,
  validationFails: validationRuns.filter((run) => run.status === "FAIL").length,
  lastValidation: validationRuns[0],
  currentTask: tasks.find((task) => task.status === "In Progress")?.title ?? "No active task",
  alerts: [
    "One validation run is currently failing.",
    "One task is blocked by validation wording consistency."
  ]
};

export function taskById(id: string) {
  return tasks.find((task) => task.id === id);
}

export function validationById(id: string) {
  return validationRuns.find((run) => run.id === id);
}
