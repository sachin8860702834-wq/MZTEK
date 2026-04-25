import crypto from "node:crypto";
import http from "node:http";

import {
  buildGoogleAuthorizationUrl,
  createPkcePair,
  exchangeGoogleCodeForTokens,
  fetchGoogleUserProfile,
  googleOAuthConfigFromEnv
} from "./google-auth.js";

const SESSION_COOKIE = "mztek_session";
const AUTH_TTL_MS = 10 * 60 * 1000;

function json(res, statusCode, body, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  res.end(JSON.stringify(body, null, 2));
}

function redirect(res, location, extraHeaders = {}) {
  res.writeHead(302, {
    location,
    ...extraHeaders
  });
  res.end();
}

function parseCookies(rawCookie = "") {
  return rawCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const index = item.indexOf("=");
      if (index === -1) {
        return acc;
      }

      const key = item.slice(0, index).trim();
      const value = item.slice(index + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function createSessionStore() {
  const sessions = new Map();

  return {
    create(user, tokens) {
      const id = crypto.randomUUID();
      const session = {
        id,
        user,
        tokens,
        createdAt: new Date().toISOString()
      };
      sessions.set(id, session);
      return session;
    },
    get(id) {
      return sessions.get(id) ?? null;
    }
  };
}

function createPendingAuthStore() {
  const pending = new Map();

  return {
    create() {
      const state = crypto.randomUUID();
      const pkce = createPkcePair();
      pending.set(state, {
        state,
        verifier: pkce.verifier,
        createdAt: Date.now()
      });
      return {
        state,
        verifier: pkce.verifier,
        challenge: pkce.challenge
      };
    },
    consume(state) {
      const record = pending.get(state);
      pending.delete(state);
      if (!record) {
        return null;
      }

      if (Date.now() - record.createdAt > AUTH_TTL_MS) {
        return null;
      }

      return record;
    }
  };
}

function readSession(req, sessionStore) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE];
  return sessionId ? sessionStore.get(sessionId) : null;
}

export function formatGoogleConnection(session) {
  if (!session) {
    return {
      connected: false,
      provider: "google",
      note: "No Google account is connected."
    };
  }

  return {
    connected: true,
    provider: "google",
    user: {
      id: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture
    },
    scopes: session.tokens.scope ? session.tokens.scope.split(" ") : []
  };
}

export function createApiServer({
  env = process.env,
  fetchImpl = fetch,
  sessionStore = createSessionStore(),
  pendingAuthStore = createPendingAuthStore()
} = {}) {
  const oauth = googleOAuthConfigFromEnv(env);

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, {
        ok: true,
        service: "mztek-api"
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/auth/google/start") {
      if (!oauth.clientId || !oauth.clientSecret) {
        json(res, 500, {
          ok: false,
          error: "Google OAuth is not configured. Set MZTEK_GOOGLE_CLIENT_ID and MZTEK_GOOGLE_CLIENT_SECRET."
        });
        return;
      }

      const pendingAuth = pendingAuthStore.create();
      const authUrl = buildGoogleAuthorizationUrl({
        clientId: oauth.clientId,
        redirectUri: oauth.redirectUri,
        state: pendingAuth.state,
        codeChallenge: pendingAuth.challenge
      });

      redirect(res, authUrl);
      return;
    }

    if (req.method === "GET" && url.pathname === "/auth/google/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        json(res, 400, {
          ok: false,
          error: "Missing code or state in Google callback."
        });
        return;
      }

      const pendingAuth = pendingAuthStore.consume(state);
      if (!pendingAuth) {
        json(res, 400, {
          ok: false,
          error: "Invalid or expired Google OAuth state."
        });
        return;
      }

      try {
        const tokens = await exchangeGoogleCodeForTokens(
          {
            code,
            clientId: oauth.clientId,
            clientSecret: oauth.clientSecret,
            redirectUri: oauth.redirectUri,
            codeVerifier: pendingAuth.verifier
          },
          fetchImpl
        );

        const user = await fetchGoogleUserProfile(tokens.access_token, fetchImpl);
        const session = sessionStore.create(user, tokens);

        json(
          res,
          200,
          {
            ok: true,
            message: "Google account connected to MZTEK.",
            connection: formatGoogleConnection(session)
          },
          {
            "set-cookie": `${SESSION_COOKIE}=${encodeURIComponent(session.id)}; HttpOnly; Path=/; SameSite=Lax`
          }
        );
      } catch (error) {
        json(res, 502, {
          ok: false,
          error: error.message
        });
      }

      return;
    }

    if (req.method === "GET" && url.pathname === "/me") {
      const session = readSession(req, sessionStore);
      json(res, 200, {
        ok: true,
        authenticated: Boolean(session),
        session: session
          ? {
              user: session.user,
              createdAt: session.createdAt
            }
          : null
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/connectors/google/status") {
      const session = readSession(req, sessionStore);
      json(res, 200, {
        ok: true,
        connection: formatGoogleConnection(session)
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/connectors/google/notebooklm") {
      const session = readSession(req, sessionStore);

      if (!session) {
        json(res, 401, {
          ok: false,
          error: "Google connection required."
        });
        return;
      }

      json(res, 501, {
        ok: false,
        message: "NotebookLM direct ingestion is not implemented yet.",
        recommendedPath: [
          "Use the connected Google account for source-aware integrations.",
          "Start with Google Drive and document ingestion.",
          "Treat NotebookLM as an optional future adapter, not the system of record."
        ]
      });
      return;
    }

    json(res, 404, {
      ok: false,
      error: `No route for ${req.method} ${url.pathname}`
    });
  });
}

export function startApiServer(options = {}) {
  const port = options.port ?? Number(process.env.MZTEK_API_PORT ?? 4317);
  const server = createApiServer(options);
  server.listen(port);
  return server;
}
