import { loadConnectionState, publicConnectionState, updateConnectionState } from "../connection-store.js";
import { runNvidiaWorkforceTask } from "../workforce/index.js";

function inferProjectType(message = "", fileNames = [], links = {}) {
  const haystack = `${message} ${fileNames.join(" ")} ${Object.values(links).join(" ")}`.toLowerCase();

  if (haystack.includes("dashboard") || haystack.includes("admin")) {
    return "Internal dashboard or control workspace";
  }

  if (haystack.includes("ai") || haystack.includes("model") || haystack.includes("agent")) {
    return "AI-assisted product system";
  }

  if (haystack.includes("landing") || haystack.includes("website")) {
    return "Marketing or web product";
  }

  return "Software product workspace";
}

export function buildMockControlRoomResponse({ message, fileNames = [], links = {} }) {
  const projectType = inferProjectType(message, fileNames, links);
  const timestamp = new Date().toISOString();

  return {
    mode: "mock",
    summary: `MZTEK prepared an initial plan for: ${message}`,
    contextSummary: [
      fileNames.length ? `${fileNames.length} files were attached for context.` : "No files attached yet.",
      Object.values(links).filter(Boolean).length ? "External links were included for additional grounding." : "No external links provided.",
      `Detected project type: ${projectType}.`
    ],
    projectType,
    tasks: [
      {
        id: "TASK-I1",
        title: "Capture the incoming request",
        description: "Store the founder goal, attached files, and linked sources as controlled input.",
        status: "active",
        column: "intake",
        proof: "goal captured",
        updatedAt: timestamp
      },
      {
        id: "TASK-U1",
        title: "Understand the requested build",
        description: "Analyze the goal, files, and links to define scope and key constraints.",
        status: "active",
        column: "understanding",
        proof: "request analyzed",
        updatedAt: timestamp
      },
      {
        id: "TASK-P1",
        title: "Break work into execution phases",
        description: "Create planning, build, review, and validation work items for the goal.",
        status: "ready",
        column: "planning",
        proof: "initial plan",
        updatedAt: timestamp
      },
      {
        id: "TASK-B1",
        title: "Prepare provider abstraction",
        description: "Keep model calls provider-ready so NVIDIA, OpenAI-compatible APIs, or local models can be plugged in later.",
        status: "queued",
        column: "building",
        proof: "architecture note",
        updatedAt: timestamp
      },
      {
        id: "TASK-R1",
        title: "Run QA review on assumptions",
        description: "Check scope drift, weak evidence, and missing product constraints before implementation expands.",
        status: "queued",
        column: "reviewing",
        proof: "qa lane pending",
        updatedAt: timestamp
      }
    ],
    activity: [
      { kind: "system", title: "System analyzed goal", detail: message, at: timestamp },
      { kind: "planning", title: "Planning created work items", detail: "Initial phases were created for intake, understanding, planning, building, and review.", at: timestamp },
      { kind: "decision", title: "Decision made", detail: "Use a provider abstraction so model routing does not depend on one vendor.", at: timestamp },
      { kind: "review", title: "Review found risk", detail: "Validation and runtime evidence are still missing for any implementation claims.", at: timestamp }
    ],
    decisions: [
      {
        decision: "Treat the request as a product workflow, not an IDE task.",
        reason: "The dashboard is intended to be the founder control room.",
        evidence: "Incoming goal and context inputs.",
        impact: "The system focuses on work tracking, decisions, and risks rather than editor operations.",
        at: timestamp
      },
      {
        decision: "Separate builder and QA communication.",
        reason: "Reviewability is lost when the same lane both builds and judges.",
        evidence: "Current MZTEK QA ledger design.",
        impact: "Side-by-side critique stays visible in the dashboard.",
        at: timestamp
      },
      {
        decision: "Keep provider integration abstract.",
        reason: "The product should not depend on one AI vendor.",
        evidence: "Mock/NVIDIA routing and future-provider roadmap.",
        impact: "NVIDIA can be used now while future providers remain easy to add.",
        at: timestamp
      }
    ],
    risks: [
      "Uploaded files are represented as names only in this prototype.",
      "No runtime validator is attached to generated work yet.",
      "Mock mode can structure work, but it does not prove implementation."
    ],
    nextActions: [
      "Review the generated work board.",
      "Refine the goal or attach more files for better grounding.",
      "Connect NVIDIA to replace mock responses with real provider analysis."
    ]
  };
}

function extractJsonObject(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) {
    return JSON.parse(fenced[1]);
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }

  throw new Error("Model response did not include a valid JSON object.");
}

function normalizeBaseUrl(baseUrl = "") {
  return String(baseUrl || "https://integrate.api.nvidia.com/v1").trim().replace(/\/$/, "");
}

function nvidiaHeaders(apiKey) {
  return {
    accept: "application/json",
    authorization: `Bearer ${apiKey}`
  };
}

function fromEnv(env = process.env) {
  const apiKey = String(env.NVIDIA_API_KEY || "").trim();
  const baseUrl = normalizeBaseUrl(env.NVIDIA_BASE_URL);
  const model = String(env.NVIDIA_DEFAULT_MODEL || "").trim();

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl,
    activeModel: model
  };
}

function publicStatusFromStored(rootDir, env = process.env) {
  const stored = publicConnectionState(rootDir).nvidia;
  if (stored.connected || stored.authStatus === "failed") {
    return stored;
  }

  const envState = fromEnv(env);
  if (!envState) {
    return stored;
  }

  return {
    connected: true,
    authStatus: "connected",
    baseUrl: envState.baseUrl,
    activeModel: envState.activeModel || "configured",
    availableModels: [],
    validationStatus: envState.activeModel ? "pass" : "pending_model",
    validationMessage: envState.activeModel
      ? "NVIDIA credentials are configured from the server environment."
      : "NVIDIA API key is configured, but the default model is still missing.",
    verifiedAt: ""
  };
}

async function fetchModels({ apiKey, baseUrl, fetchImpl = fetch }) {
  const response = await fetchImpl(`${normalizeBaseUrl(baseUrl)}/models`, {
    headers: nvidiaHeaders(apiKey)
  });
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `NVIDIA model lookup failed (${response.status}).`,
      reason: body?.error?.message || body?.detail || text || response.statusText
    };
  }

  const models = Array.isArray(body?.data)
    ? body.data.map((item) => item.id).filter(Boolean)
    : [];

  return {
    ok: true,
    models
  };
}

function resolvedCredentials(rootDir, env = process.env) {
  const state = loadConnectionState(rootDir);
  if (state.nvidia.connected && state.nvidia.apiKey) {
    return {
      apiKey: state.nvidia.apiKey,
      baseUrl: state.nvidia.baseUrl,
      activeModel: state.nvidia.activeModel || state.nvidia.availableModels[0] || ""
    };
  }

  return fromEnv(env);
}

export function getNvidiaStatus(rootDir, env = process.env) {
  const publicState = publicStatusFromStored(rootDir, env);

  if (!publicState.connected) {
    return {
      status: "not_connected",
      mode: "mock",
      label: "NVIDIA NIM",
      baseUrl: publicState.baseUrl || normalizeBaseUrl(""),
      model: "",
      models: [],
      warning: publicState.validationMessage || "Connect NVIDIA to enable live model responses."
    };
  }

  if (publicState.validationStatus !== "pass") {
    return {
      status: "pending",
      mode: "nvidia",
      label: "NVIDIA NIM",
      baseUrl: publicState.baseUrl,
      model: publicState.activeModel,
      models: publicState.availableModels,
      warning: publicState.validationMessage
    };
  }

  return {
    status: "connected",
    mode: "nvidia",
    label: "NVIDIA NIM",
    baseUrl: publicState.baseUrl,
    model: publicState.activeModel,
    models: publicState.availableModels,
    warning: ""
  };
}

export async function connectNvidia({ rootDir, apiKey, baseUrl, selectedModel = "", fetchImpl = fetch }) {
  if (!String(apiKey || "").trim()) {
    return {
      ok: false,
      error: "NVIDIA API key is required."
    };
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const modelsResult = await fetchModels({
    apiKey: String(apiKey).trim(),
    baseUrl: normalizedBaseUrl,
    fetchImpl
  });

  if (!modelsResult.ok) {
    updateConnectionState(rootDir, (state) => {
      state.nvidia.connected = false;
      state.nvidia.authStatus = "failed";
      state.nvidia.baseUrl = normalizedBaseUrl;
      state.nvidia.activeModel = "";
      state.nvidia.availableModels = [];
      state.nvidia.validationStatus = "failed";
      state.nvidia.validationMessage = modelsResult.reason || modelsResult.error;
      state.nvidia.verifiedAt = "";
      state.nvidia.apiKey = "";
      return state;
    });

    return modelsResult;
  }

  const activeModel = selectedModel || modelsResult.models[0] || "";

  updateConnectionState(rootDir, (state) => {
    state.nvidia.connected = true;
    state.nvidia.authStatus = "connected";
    state.nvidia.baseUrl = normalizedBaseUrl;
    state.nvidia.activeModel = activeModel;
    state.nvidia.availableModels = modelsResult.models;
    state.nvidia.validationStatus = "pass";
    state.nvidia.validationMessage = "NVIDIA connection validated through /v1/models.";
    state.nvidia.verifiedAt = new Date().toISOString();
    state.nvidia.apiKey = String(apiKey).trim();
    return state;
  });

  return {
    ok: true,
    providerStatus: publicConnectionState(rootDir).nvidia,
    message: "NVIDIA connection validated and stored securely."
  };
}

export async function validateNvidiaConnection({ rootDir, env = process.env, fetchImpl = fetch }) {
  const credentials = resolvedCredentials(rootDir, env);
  if (!credentials?.apiKey) {
    return {
      ok: false,
      providerStatus: getNvidiaStatus(rootDir, env),
      error: "NVIDIA is not connected. Use the dashboard connect flow to store a key securely."
    };
  }

  const result = await fetchModels({
    apiKey: credentials.apiKey,
    baseUrl: credentials.baseUrl,
    fetchImpl
  });

  if (!result.ok) {
    updateConnectionState(rootDir, (state) => {
      state.nvidia.connected = false;
      state.nvidia.authStatus = "failed";
      state.nvidia.validationStatus = "failed";
      state.nvidia.validationMessage = result.reason || result.error;
      state.nvidia.verifiedAt = "";
      if (!state.nvidia.apiKey && credentials.apiKey) {
        state.nvidia.apiKey = credentials.apiKey;
      }
      return state;
    });
    return {
      ok: false,
      providerStatus: getNvidiaStatus(rootDir, env),
      error: result.reason || result.error
    };
  }

  updateConnectionState(rootDir, (state) => {
    if (state.nvidia.apiKey || !fromEnv(env)?.apiKey) {
      state.nvidia.connected = true;
      state.nvidia.authStatus = "connected";
      state.nvidia.baseUrl = credentials.baseUrl;
      state.nvidia.availableModels = result.models;
      state.nvidia.activeModel = state.nvidia.activeModel || credentials.activeModel || result.models[0] || "";
      state.nvidia.validationStatus = "pass";
      state.nvidia.validationMessage = "NVIDIA connection validated through /v1/models.";
      state.nvidia.verifiedAt = new Date().toISOString();
      if (!state.nvidia.apiKey && credentials.apiKey) {
        state.nvidia.apiKey = credentials.apiKey;
      }
    }
    return state;
  });

  return {
    ok: true,
    providerStatus: getNvidiaStatus(rootDir, env),
    message: "NVIDIA connection validated and real mode is active."
  };
}

export async function callNvidiaChat({ rootDir, env = process.env, fetchImpl = fetch, payload }) {
  const status = getNvidiaStatus(rootDir, env);
  const credentials = resolvedCredentials(rootDir, env);

  if (!credentials?.apiKey || status.status !== "connected") {
    return {
      ok: true,
      provider: "mock",
      result: buildMockControlRoomResponse(payload),
      providerStatus: status
    };
  }

  const systemPrompt = [
    "You are generating a control-room planning response for MZTEK.",
    "Return valid JSON only.",
    "Use keys: summary, contextSummary, projectType, tasks, activity, decisions, risks, nextActions.",
    "Each task must include id, title, description, status, column, proof, updatedAt.",
    "Each activity item must include kind, title, detail, at.",
    "Each decision must include decision, reason, evidence, impact, at."
  ].join(" ");

  const workforce = await runNvidiaWorkforceTask({
    rootDir,
    env: {
      ...env,
      NVIDIA_API_KEY: credentials.apiKey,
      NVIDIA_BASE_URL: credentials.baseUrl,
      NVIDIA_DEFAULT_MODEL: credentials.activeModel
    },
    fetchImpl,
    taskType: "analysis",
    taskId: "TASK-COUNCIL-001",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) }
    ]
  });

  if (!workforce.ok) {
    return {
      ok: false,
      statusCode: 502,
      error: `NVIDIA workforce failed: ${workforce.error}`,
      providerStatus: status
    };
  }

  const content = workforce.chosen.content;

  try {
    return {
      ok: true,
      provider: "nvidia",
      result: {
        ...extractJsonObject(content),
        modelUsage: {
          selectedModel: workforce.chosen.model,
          comparedModels: workforce.runs.map((run) => run.model),
          decisionReason: workforce.decisionReason,
          estimatedTokens: workforce.usage?.estimatedTokens || 0,
          estimatedCostUsd: workforce.usage?.estimatedCostUsd || 0
        },
        council: {
          routes: workforce.council?.routes || [],
          summary: workforce.council?.summary || null
        }
      },
      providerStatus: status
    };
  } catch {
    return {
      ok: true,
      provider: "nvidia",
      result: {
        mode: "nvidia-fallback",
        summary: content,
        contextSummary: [],
        projectType: inferProjectType(payload.message, payload.fileNames, payload.links),
        tasks: [],
        activity: [],
        decisions: [
          {
            decision: "Fallback to plain summary display.",
            reason: "The NVIDIA response was not valid JSON.",
            evidence: "Response parse failure.",
            impact: "The dashboard keeps the returned text but loses structured task detail.",
            at: new Date().toISOString()
          }
        ],
        risks: ["NVIDIA response could not be parsed into structured JSON."],
        nextActions: ["Refine the prompt or tighten JSON-only system instructions."]
      },
      providerStatus: status
    };
  }
}
