import type {
  AnalyzeProjectResponse,
  ApiResult,
  DashboardData,
  GitHubConnectResponse,
  GitHubPollResponse,
  NvidiaChatResponse,
  NvidiaValidateResponse
} from "@/lib/dashboard-types";

async function readJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {})
      },
      cache: "no-store"
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as T & { error?: string }) : ({} as T & { error?: string });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: String(payload?.error || `Request failed (${response.status}).`)
      };
    }
    return {
      ok: true,
      status: response.status,
      data: payload as T
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Request failed."
    };
  }
}

export async function fetchDashboard(project = "mztek") {
  return readJson<DashboardData>(`/api/mztek/dashboard?project=${encodeURIComponent(project)}`);
}

export async function analyzeProject(payload: {
  githubUrl?: string;
  websiteUrl?: string;
  productUrl?: string;
  fileNames?: string[];
}) {
  return readJson<AnalyzeProjectResponse>("/api/mztek/analyze-project", {
    method: "POST",
    body: JSON.stringify({
      links: {
        github: payload.githubUrl || "",
        website: payload.websiteUrl || "",
        product: payload.productUrl || ""
      },
      fileNames: payload.fileNames || []
    })
  });
}

export async function runCommand(payload: {
  message: string;
  githubUrl?: string;
  websiteUrl?: string;
  productUrl?: string;
  fileNames?: string[];
}) {
  return readJson<NvidiaChatResponse>("/api/mztek/nvidia-chat", {
    method: "POST",
    body: JSON.stringify({
      message: payload.message,
      links: {
        github: payload.githubUrl || "",
        website: payload.websiteUrl || "",
        product: payload.productUrl || ""
      },
      fileNames: payload.fileNames || []
    })
  });
}

export async function connectGitHub(repoUrl: string) {
  return readJson<GitHubConnectResponse>("/api/mztek/github/connect", {
    method: "POST",
    body: JSON.stringify({ repoUrl: repoUrl || "" })
  });
}

export async function pollGitHubConnection() {
  return readJson<GitHubPollResponse>("/api/mztek/github/poll", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function validateNvidia(apiKey?: string) {
  return readJson<NvidiaValidateResponse>("/api/mztek/nvidia/validate", {
    method: "POST",
    body: JSON.stringify({
      apiKey: apiKey || ""
    })
  });
}
