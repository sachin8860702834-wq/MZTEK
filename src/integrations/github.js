import { loadConnectionState, publicConnectionState, updateConnectionState } from "../connection-store.js";

const GITHUB_API = "https://api.github.com";
const DEVICE_CODE_URL = "https://github.com/login/device/code";
const DEVICE_TOKEN_URL = "https://github.com/login/oauth/access_token";

export function parseGitHubRepoUrl(url) {
  const match = String(url || "").trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/?#].*)?$/i);
  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    name: match[2]
  };
}

function githubHeaders(token = "") {
  return {
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "user-agent": "MZTEK-Control-Room",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

export function getGitHubOauthConfig(env = process.env) {
  const clientId = String(env.MZTEK_GITHUB_CLIENT_ID || env.GITHUB_CLIENT_ID || "").trim();
  return {
    configured: Boolean(clientId),
    clientId
  };
}

async function fetchJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body,
    text
  };
}

export async function validateGitHubAccess({ token, repoUrl, fetchImpl = fetch }) {
  const userResponse = await fetchJson(fetchImpl, `${GITHUB_API}/user`, {
    headers: githubHeaders(token)
  });

  if (!userResponse.ok) {
    return {
      ok: false,
      error: `GitHub user validation failed (${userResponse.status}).`,
      reason: userResponse.body?.message || userResponse.statusText
    };
  }

  const user = {
    login: userResponse.body?.login || "",
    name: userResponse.body?.name || "",
    htmlUrl: userResponse.body?.html_url || ""
  };

  if (!repoUrl) {
    return {
      ok: true,
      user,
      repo: null,
      permissionStatus: "user_only"
    };
  }

  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) {
    return {
      ok: false,
      error: "Invalid GitHub repository URL. Use https://github.com/owner/repo."
    };
  }

  const repoResponse = await fetchJson(fetchImpl, `${GITHUB_API}/repos/${parsed.owner}/${parsed.name}`, {
    headers: githubHeaders(token)
  });

  if (!repoResponse.ok) {
    return {
      ok: false,
      error: `GitHub repo lookup failed (${repoResponse.status}).`,
      reason: repoResponse.body?.message || repoResponse.statusText,
      user
    };
  }

  const permissions = repoResponse.body?.permissions || {};
  const permissionStatus = permissions.admin
    ? "admin"
    : permissions.push
      ? "write"
      : permissions.pull
        ? "read"
        : "unknown";

  return {
    ok: true,
    user,
    repo: {
      fullName: repoResponse.body?.full_name || `${parsed.owner}/${parsed.name}`,
      owner: repoResponse.body?.owner?.login || parsed.owner,
      name: repoResponse.body?.name || parsed.name,
      defaultBranch: repoResponse.body?.default_branch || "unknown",
      private: Boolean(repoResponse.body?.private),
      htmlUrl: repoResponse.body?.html_url || repoUrl
    },
    permissionStatus
  };
}

export async function startGitHubDeviceFlow({ rootDir, repoUrl, env = process.env, fetchImpl = fetch }) {
  const oauth = getGitHubOauthConfig(env);

  if (!oauth.configured) {
    return {
      ok: false,
      error: "GitHub OAuth is not configured on the server yet. Set MZTEK_GITHUB_CLIENT_ID server-side to enable official GitHub device flow."
    };
  }

  const response = await fetchJson(fetchImpl, DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "MZTEK-Control-Room"
    },
    body: JSON.stringify({
      client_id: oauth.clientId,
      scope: "read:user repo"
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `GitHub device flow could not start (${response.status}).`,
      reason: response.body?.error_description || response.statusText
    };
  }

  const deviceFlow = {
    deviceCode: response.body?.device_code || "",
    userCode: response.body?.user_code || "",
    verificationUri: response.body?.verification_uri || "https://github.com/login/device",
    interval: Number(response.body?.interval || 5),
    expiresAt: new Date(Date.now() + Number(response.body?.expires_in || 900) * 1000).toISOString(),
    startedAt: new Date().toISOString()
  };

  updateConnectionState(rootDir, (state) => {
    state.github.deviceFlow = deviceFlow;
    state.github.repoUrl = repoUrl || state.github.repoUrl || "";
    state.github.repoOwner = "";
    state.github.repoName = "";
    state.github.repoFullName = "";
    state.github.connected = false;
    state.github.authStatus = "pending_authorization";
    state.github.validationStatus = "pending";
    state.github.validationMessage = "Waiting for GitHub authorization approval.";
    state.github.permissionStatus = "pending";
    state.github.verifiedAt = "";
    state.github.token = "";
    return state;
  });

  return {
    ok: true,
    deviceFlow
  };
}

export async function pollGitHubDeviceFlow({ rootDir, env = process.env, fetchImpl = fetch }) {
  const oauth = getGitHubOauthConfig(env);
  if (!oauth.configured) {
    return {
      ok: false,
      error: "GitHub OAuth is not configured on the server."
    };
  }

  const state = loadConnectionState(rootDir);
  const deviceFlow = state.github.deviceFlow;
  if (!deviceFlow?.deviceCode) {
    return {
      ok: false,
      error: "No active GitHub device authorization is waiting for approval."
    };
  }

  const response = await fetchJson(fetchImpl, DEVICE_TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "MZTEK-Control-Room"
    },
    body: JSON.stringify({
      client_id: oauth.clientId,
      device_code: deviceFlow.deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code"
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `GitHub device polling failed (${response.status}).`,
      reason: response.body?.error_description || response.statusText
    };
  }

  if (response.body?.error) {
    const error = response.body.error;
    if (error === "authorization_pending" || error === "slow_down") {
      return {
        ok: true,
        pending: true,
        interval: Number(response.body.interval || deviceFlow.interval || 5),
        message: "Waiting for GitHub approval."
      };
    }

    updateConnectionState(rootDir, (current) => {
      current.github.connected = false;
      current.github.authStatus = "failed";
      current.github.validationStatus = "failed";
      current.github.validationMessage = response.body.error_description || "GitHub authorization failed.";
      current.github.deviceFlow = null;
      current.github.token = "";
      return current;
    });

    return {
      ok: false,
      error: response.body.error_description || "GitHub authorization failed."
    };
  }

  const token = response.body?.access_token || "";
  if (!token) {
    return {
      ok: false,
      error: "GitHub did not return an access token."
    };
  }

  const validation = await validateGitHubAccess({
    token,
    repoUrl: state.github.repoUrl,
    fetchImpl
  });

  if (!validation.ok) {
    updateConnectionState(rootDir, (current) => {
      current.github.connected = false;
      current.github.authStatus = "failed";
      current.github.validationStatus = "failed";
      current.github.validationMessage = validation.reason || validation.error;
      current.github.deviceFlow = null;
      current.github.token = "";
      return current;
    });
    return validation;
  }

  updateConnectionState(rootDir, (current) => {
    current.github.connected = true;
    current.github.authStatus = "connected";
    current.github.username = validation.user.login;
    current.github.repoUrl = current.github.repoUrl || "";
    current.github.repoOwner = validation.repo?.owner || "";
    current.github.repoName = validation.repo?.name || "";
    current.github.repoFullName = validation.repo?.fullName || "";
    current.github.permissionStatus = validation.permissionStatus;
    current.github.validationStatus = "pass";
    current.github.validationMessage = validation.repo
      ? `GitHub connected and ${validation.repo.fullName} is accessible.`
      : "GitHub connected and user profile validated.";
    current.github.verifiedAt = new Date().toISOString();
    current.github.deviceFlow = null;
    current.github.token = token;
    return current;
  });

  return {
    ok: true,
    pending: false,
    connection: publicConnectionState(rootDir).github
  };
}

export function summarizeGitHubIntegration(rootDir, repoUrl = "") {
  const publicState = publicConnectionState(rootDir).github;
  const fallbackRepo = parseGitHubRepoUrl(repoUrl || publicState.repoUrl);

  if (publicState.connected) {
    return {
      key: "github",
      title: "GitHub",
      status: "connected",
      summary: publicState.repoFullName
        ? `Connected as ${publicState.username}. Repo access verified for ${publicState.repoFullName}.`
        : `Connected as ${publicState.username}.`,
      username: publicState.username,
      repoUrl: publicState.repoUrl,
      repoFullName: publicState.repoFullName,
      permissionStatus: publicState.permissionStatus,
      warning: "",
      deviceFlow: null
    };
  }

  if (publicState.authStatus === "pending_authorization" && publicState.deviceFlow) {
    return {
      key: "github",
      title: "GitHub",
      status: "pending",
      summary: `Waiting for GitHub approval with code ${publicState.deviceFlow.userCode}.`,
      username: "",
      repoUrl: publicState.repoUrl,
      repoFullName: fallbackRepo ? `${fallbackRepo.owner}/${fallbackRepo.name}` : "",
      permissionStatus: "pending",
      warning: "Approve the official GitHub device flow to finish connecting.",
      deviceFlow: publicState.deviceFlow
    };
  }

  if (repoUrl || publicState.repoUrl) {
    return {
      key: "github",
      title: "GitHub",
      status: "not_connected",
      summary: fallbackRepo
        ? `Repository linked: ${fallbackRepo.owner}/${fallbackRepo.name}. Authentication still required.`
        : "Repository URL is attached, but authentication is not complete.",
      username: "",
      repoUrl: repoUrl || publicState.repoUrl,
      repoFullName: fallbackRepo ? `${fallbackRepo.owner}/${fallbackRepo.name}` : "",
      permissionStatus: "not_connected",
      warning: publicState.validationMessage || "Start the official GitHub device flow to grant dashboard access.",
      deviceFlow: null
    };
  }

  return {
    key: "github",
    title: "GitHub",
    status: "not_connected",
    summary: "No GitHub authorization has been completed yet.",
    username: "",
    repoUrl: "",
    repoFullName: "",
    permissionStatus: "not_connected",
    warning: "Connect GitHub to validate the account and repo context through the official device flow.",
    deviceFlow: null
  };
}
