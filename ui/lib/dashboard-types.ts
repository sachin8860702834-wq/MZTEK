export type StepMode = "observer" | "controller" | string;

export type IntegrationStatus =
  | "connected"
  | "ready"
  | "planned"
  | "needs_auth"
  | "not_connected"
  | "error"
  | "unknown"
  | string;

export type ControllerState = {
  mode: StepMode;
  currentStep: string;
  nextAction: string;
  blocker?: string;
  permissions?: string[];
};

export type ProjectState = {
  name: string;
  summary: string;
  phase?: string;
  status?: string;
  benchmarkPack?: string;
  sampleProject?: string;
  updatedAt?: string;
  type?: string;
};

export type IntegrationCard = {
  key: string;
  title: string;
  status: IntegrationStatus;
  summary?: string;
  detail?: string;
  warning?: string;
  model?: string;
  models?: string[];
  baseUrl?: string;
  username?: string;
  permissionStatus?: string;
  chatFeatureEnabled?: boolean;
};

export type BoardItem = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  proof?: number | string;
  updatedAt?: string;
};

export type BoardColumn = {
  key: string;
  title: string;
  items: BoardItem[];
};

export type ActivityEntry = {
  kind?: string;
  title: string;
  detail: string;
  at: string;
};

export type DecisionEntry = {
  decision: string;
  reason: string;
  evidence?: string;
  impact?: string;
  at: string;
};

export type CouncilRunSummary = {
  accepted?: number;
  rejected?: number;
  totalEstimatedTokens?: number;
  totalEstimatedCostUsd?: number;
};

export type CouncilRun = {
  runId?: string;
  startedAt?: string;
  completedAt?: string;
  objective?: string;
  summary?: CouncilRunSummary;
  assignments?: Array<{
    role: string;
    model: string;
    rationale?: string;
  }>;
};

export type CouncilUsage = {
  runs?: number;
  accepted?: number;
  rejected?: number;
  totalEstimatedTokens?: number;
  totalEstimatedCostUsd?: number;
};

export type DashboardData = {
  generatedAt: string;
  project: ProjectState;
  controller: ControllerState;
  integrations: IntegrationCard[];
  boardColumns: BoardColumn[];
  activityFeed: ActivityEntry[];
  decisionLog: DecisionEntry[];
  onboarding?: {
    prompt?: string;
    ready?: boolean;
    firstAction?: string;
  };
  council?: {
    latest?: CouncilRun | null;
    recentRuns?: CouncilRun[];
    usage?: CouncilUsage;
  };
};

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export type AnalyzeProjectResponse = {
  ok: boolean;
  analysis?: {
    summary?: string;
  };
};

export type NvidiaChatResponse = {
  ok: boolean;
  provider?: string;
  providerStatus?: string;
  result?: {
    mode?: string;
    tasks?: Array<{ id?: string; title?: string }>;
    summary?: string;
  };
};

export type GitHubConnectResponse = {
  ok: boolean;
  deviceFlow?: {
    userCode?: string;
    verificationUri?: string;
    expiresIn?: number;
  };
  integration?: {
    status?: string;
    repoFullName?: string;
    username?: string;
  };
};

export type GitHubPollResponse = {
  ok: boolean;
  pending?: boolean;
  message?: string;
  integration?: {
    status?: string;
    repoFullName?: string;
    username?: string;
  };
};

export type NvidiaValidateResponse = {
  ok: boolean;
  message?: string;
  providerStatus?: {
    status?: string;
    model?: string;
    models?: string[];
  };
};
