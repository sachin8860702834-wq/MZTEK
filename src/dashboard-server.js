import http from "node:http";

import { buildDashboardData } from "./dashboard-data.js";
import { renderDashboardPage } from "./dashboard-page.js";
import {
  parseGitHubRepoUrl,
  pollGitHubDeviceFlow,
  startGitHubDeviceFlow,
  summarizeGitHubIntegration
} from "./integrations/github.js";
import { analyzeProjectContext, summarizeFileUploads } from "./integrations/files.js";
import {
  callNvidiaChat,
  connectNvidia,
  getNvidiaStatus,
  isNvidiaChatFeatureEnabled,
  validateNvidiaConnection
} from "./integrations/nvidia.js";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(html);
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function normalizeLinks(body) {
  return {
    github: String(body.links?.github || body.githubUrl || "").trim(),
    website: String(body.links?.website || body.websiteUrl || "").trim(),
    product: String(body.links?.product || body.productUrl || "").trim()
  };
}

function buildIntegrationCards({ env, links, fileNames, projectDir, workspaceRoot }) {
  const nvidia = getNvidiaStatus(workspaceRoot, env);
  const github = summarizeGitHubIntegration(workspaceRoot, links.github);
  const files = summarizeFileUploads(fileNames);
  const nvidiaChatEnabled = isNvidiaChatFeatureEnabled(env);

  return [
    {
      key: "nvidia",
      title: "NVIDIA NIM",
      status: nvidia.status,
      summary: nvidia.status === "connected"
        ? (nvidiaChatEnabled
          ? "Connected through the dashboard and validated with a real API response."
          : "Connected, but workforce chat is currently feature-gated.")
        : "Connect NVIDIA from the dashboard to switch out of mock mode safely.",
      detail: `${nvidia.mode.toUpperCase()} mode${nvidia.model ? ` | ${nvidia.model}` : ""}${nvidiaChatEnabled ? "" : " | Experimental (Disabled)"}`,
      model: nvidia.model,
      models: nvidia.models,
      baseUrl: nvidia.baseUrl,
      chatFeatureEnabled: nvidiaChatEnabled,
      warning: nvidia.warning || ""
    },
    {
      key: "github",
      title: "GitHub",
      status: github.status,
      summary: github.summary,
      detail: github.repoFullName || github.summary,
      username: github.username,
      permissionStatus: github.permissionStatus,
      warning: github.warning || ""
    },
    {
      key: "local-project",
      title: "Local project",
      status: "ready",
      detail: projectDir,
      warning: ""
    },
    {
      key: "files",
      title: "File uploads",
      status: files.status,
      detail: files.summary,
      warning: ""
    },
    {
      key: "mock-provider",
      title: "Mock provider",
      status: "ready",
      detail: "Available when live provider credentials are missing.",
      warning: ""
    },
    {
      key: "future-providers",
      title: "Future providers",
      status: "planned",
      detail: "OpenAI-compatible and local providers can be added later.",
      warning: ""
    }
  ];
}

function buildContextPayload({ projectDir, fileNames, links, analysis }) {
  return {
    projectDir,
    fileNames,
    links,
    analysis: {
      summary: analysis.summary,
      detectedStack: analysis.detectedStack,
      missingPieces: analysis.missingPieces,
      risks: analysis.risks,
      nextSteps: analysis.nextSteps
    }
  };
}

function buildControllerPayload(analysis) {
  return {
    mode: analysis.controllerMode || "observer",
    currentStep: analysis.currentStep || "Ready",
    nextAction: analysis.nextAction || "Review the current plan.",
    permissions: analysis.requiredInputs || []
  };
}

function augmentBriefingWithIntegrations(teamBriefing, integrations) {
  const missingIntegrations = integrations
    .filter((item) => !["connected", "ready", "planned"].includes(item.status))
    .map((item) => item.title);

  return {
    ...teamBriefing,
    missingIntegrations,
    integrationStatus: integrations.map((item) => ({
      title: item.title,
      status: item.status
    })),
    nextTasks: [
      ...(teamBriefing?.nextTasks || []),
      ...(missingIntegrations.length ? [`Resolve integration setup: ${missingIntegrations.join(", ")}.`] : [])
    ].slice(0, 5)
  };
}

function resolveProjectDir(url, projectDir, workspaceRoot) {
  const requested = url.searchParams.get("project");

  if (requested === "mztek") {
    return workspaceRoot;
  }

  if (requested === "career-mantra") {
    return `${workspaceRoot}\\sandboxes\\career-mantra`;
  }

  return projectDir;
}

function buildActivityStreamPayload(data, runtimeItems = []) {
  const items = [
    ...runtimeItems,
    ...(data.activityFeed || []).map((item, index) => ({
      id: `activity-${index}-${item.at || "unknown"}`,
      type: "activity",
      title: item.title,
      detail: item.detail,
      at: item.at || "",
      source: item.kind || "system"
    })),
    ...(data.decisionLog || []).map((item, index) => ({
      id: `decision-${index}-${item.at || "unknown"}`,
      type: "decision",
      title: item.decision,
      detail: item.reason,
      at: item.at || "",
      source: "decision-log"
    }))
  ]
    .sort((left, right) => String(right.at).localeCompare(String(left.at)))
    .slice(0, 50);

  return {
    ok: true,
    generatedAt: data.generatedAt,
    project: {
      key: data.selectedProjectKey,
      name: data.project?.name || "",
      path: data.selectedProjectDir
    },
    items
  };
}

export function createDashboardServer({ projectDir, workspaceRoot, env = process.env, fetchImpl = fetch }) {
  const runtimeItems = [];
  let runtimeSeq = 0;
  function recordRuntimeEvent(type, detail = "", source = "runtime") {
    runtimeSeq += 1;
    runtimeItems.unshift({
      id: `runtime-${runtimeSeq}`,
      type: "runtime",
      title: type,
      detail,
      at: new Date().toISOString(),
      source
    });
    if (runtimeItems.length > 100) {
      runtimeItems.length = 100;
    }
  }

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    recordRuntimeEvent("api_request", `${request.method} ${url.pathname}`);

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "mztek-dashboard" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/nvidia-chat") {
      (async () => {
        try {
          const body = await readJsonBody(request);
          const message = String(body.message || "").trim();
          const links = normalizeLinks(body);
          const fileNames = Array.isArray(body.fileNames) ? body.fileNames : [];

          if (!message) {
            sendJson(response, 400, {
              ok: false,
              error: "Message is required."
            });
            return;
          }

          const result = await callNvidiaChat({
            rootDir: workspaceRoot,
            env,
            fetchImpl,
            payload: {
              message,
              fileNames,
              links
            }
          });

          if (result.disabled) {
            sendJson(response, 200, {
              status: "disabled",
              message: result.message || "NVIDIA workforce is experimental and currently disabled"
            });
            return;
          }

          if (!result.ok) {
            console.error("NVIDIA chat request failed", {
              statusCode: result.statusCode || 500,
              message: result.error
            });
            sendJson(response, result.statusCode || 500, {
              ok: false,
              error: result.error
            });
            return;
          }

          sendJson(response, 200, {
            ok: true,
            provider: result.provider,
            providerStatus: result.providerStatus,
            result: result.result
          });
        } catch (error) {
          console.error("NVIDIA chat route crashed", {
            message: error?.message || String(error)
          });
          sendJson(response, 500, {
            ok: false,
            error: "Failed to process NVIDIA workforce request."
          });
        }
      })();
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/analyze-project") {
      (async () => {
        try {
          const body = await readJsonBody(request);
          const requestedProjectDir = body.projectDir ? String(body.projectDir) : resolveProjectDir(url, projectDir, workspaceRoot);
          const fileNames = Array.isArray(body.fileNames) ? body.fileNames : [];
          const links = normalizeLinks(body);
          const mode = String(body.mode || "analyze");
          const analysis = analyzeProjectContext({
            projectDir: requestedProjectDir,
            fileNames,
            links
          });
          const integrations = buildIntegrationCards({
            env,
            links,
            fileNames,
            projectDir: requestedProjectDir,
            workspaceRoot
          });
          const teamBriefing = augmentBriefingWithIntegrations(analysis.teamBriefing, integrations);

          sendJson(response, 200, {
            ok: true,
            mode,
            analysis: {
              ...analysis,
              teamBriefing
            },
            controller: buildControllerPayload(analysis),
            onboarding: {
              prompt: `Do you want MZTEK to analyze ${analysis.projectName}?`,
              ready: true,
              firstAction: analysis.nextAction
            },
            teamBriefing,
            integrations,
            contextPayload: buildContextPayload({
              projectDir: requestedProjectDir,
              fileNames,
              links,
              analysis
            })
          });
        } catch (error) {
          sendJson(response, 500, {
            ok: false,
            error: error.message
          });
        }
      })();
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/github/connect") {
      (async () => {
        try {
          const body = await readJsonBody(request);
          const repoUrl = String(body.repoUrl || body.githubUrl || "").trim();

          if (repoUrl && !parseGitHubRepoUrl(repoUrl)) {
            sendJson(response, 400, {
              ok: false,
              error: "Invalid GitHub repository URL. Use https://github.com/owner/repo."
            });
            return;
          }

          const result = await startGitHubDeviceFlow({
            rootDir: workspaceRoot,
            repoUrl,
            env,
            fetchImpl
          });

          if (!result.ok) {
            sendJson(response, 400, {
              ok: false,
              error: result.error,
              reason: result.reason
            });
            return;
          }

          sendJson(response, 200, {
            ok: true,
            deviceFlow: result.deviceFlow,
            integration: summarizeGitHubIntegration(workspaceRoot, repoUrl)
          });
        } catch (error) {
          sendJson(response, 500, {
            ok: false,
            error: error.message
          });
        }
      })();
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/github/poll") {
      (async () => {
        try {
          const result = await pollGitHubDeviceFlow({
            rootDir: workspaceRoot,
            env,
            fetchImpl
          });

          if (!result.ok) {
            sendJson(response, 400, {
              ok: false,
              error: result.error,
              reason: result.reason
            });
            return;
          }

          sendJson(response, 200, {
            ok: true,
            pending: Boolean(result.pending),
            interval: result.interval,
            message: result.message || "",
            integration: summarizeGitHubIntegration(workspaceRoot)
          });
        } catch (error) {
          sendJson(response, 500, {
            ok: false,
            error: error.message
          });
        }
      })();
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/nvidia/validate") {
      (async () => {
        try {
          const body = await readJsonBody(request);
          const apiKey = String(body.apiKey || "").trim();
          const baseUrl = String(body.baseUrl || "").trim();
          const selectedModel = String(body.selectedModel || "").trim();
          const result = apiKey
            ? await connectNvidia({
                rootDir: workspaceRoot,
                apiKey,
                baseUrl,
                selectedModel,
                fetchImpl
              })
            : await validateNvidiaConnection({
                rootDir: workspaceRoot,
                env,
                fetchImpl
              });

          if (!result.ok) {
            sendJson(response, 400, {
              ok: false,
              error: result.error,
              providerStatus: result.providerStatus
            });
            return;
          }

          sendJson(response, 200, {
            ok: true,
            message: result.message,
            providerStatus: result.providerStatus
          });
        } catch (error) {
          sendJson(response, 500, {
            ok: false,
            error: error.message
          });
        }
      })();
      return;
    }

    try {
      const resolvedProjectDir = resolveProjectDir(url, projectDir, workspaceRoot);
      const data = buildDashboardData(resolvedProjectDir, workspaceRoot, env);

      if (request.method === "GET" && url.pathname === "/api/activity-stream") {
        sendJson(response, 200, buildActivityStreamPayload(data, runtimeItems));
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/dashboard") {
        sendJson(response, 200, data);
        return;
      }

      if (request.method === "GET" && url.pathname === "/") {
        sendHtml(response, renderDashboardPage(data));
        return;
      }

      sendJson(response, 404, {
        ok: false,
        error: `No route for ${request.method} ${url.pathname}`
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error.message
      });
    }
  });

  server.recordRuntimeEvent = recordRuntimeEvent;
  return server;
}

export function startDashboardServer(options) {
  const port = options.port ?? 4321;
  const server = createDashboardServer(options);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      if (typeof server.recordRuntimeEvent === "function") {
        server.recordRuntimeEvent("dashboard_started", `listening on ${port}`);
      }
      resolve(server);
    });
  });
}
