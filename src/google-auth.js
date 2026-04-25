import crypto from "node:crypto";

export const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const DEFAULT_GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly"
];

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkcePair() {
  const verifier = toBase64Url(crypto.randomBytes(32));
  const challenge = toBase64Url(crypto.createHash("sha256").update(verifier).digest());
  return {
    verifier,
    challenge,
    method: "S256"
  };
}

export function buildGoogleAuthorizationUrl({
  clientId,
  redirectUri,
  state,
  codeChallenge,
  scopes = DEFAULT_GOOGLE_SCOPES
}) {
  if (!clientId) {
    throw new Error("Google OAuth client id is required.");
  }

  if (!redirectUri) {
    throw new Error("Google OAuth redirect URI is required.");
  }

  if (!state) {
    throw new Error("OAuth state is required.");
  }

  if (!codeChallenge) {
    throw new Error("PKCE code challenge is required.");
  }

  const url = new URL(GOOGLE_AUTH_BASE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return url.toString();
}

export function googleOAuthConfigFromEnv(env = process.env) {
  return {
    clientId: env.MZTEK_GOOGLE_CLIENT_ID ?? "",
    clientSecret: env.MZTEK_GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: env.MZTEK_GOOGLE_REDIRECT_URI ?? "http://localhost:4317/auth/google/callback"
  };
}

export async function exchangeGoogleCodeForTokens(
  {
    code,
    clientId,
    clientSecret,
    redirectUri,
    codeVerifier
  },
  fetchImpl = fetch
) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier
  });

  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorDescription = payload.error_description || payload.error || "Unknown Google token error";
    throw new Error(`Google token exchange failed: ${errorDescription}`);
  }

  return payload;
}

export async function fetchGoogleUserProfile(accessToken, fetchImpl = fetch) {
  const response = await fetchImpl(GOOGLE_USERINFO_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Google user profile fetch failed: ${payload.error || "Unknown error"}`);
  }

  return payload;
}
