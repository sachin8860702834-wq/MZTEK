# MZTEK User-Connected Source API

## Purpose

Provide a safe first-pass API layer where users can connect their own Google
account to MZTEK so the product can ingest user-owned sources without relying
on anonymous shared links or unofficial NotebookLM hacks.

## Why This Exists

NotebookLM direct public-link access is unreliable from external environments,
and user browser login does not automatically give MZTEK permission to access
Google resources.

The safer path is:
- user signs in with their own Google account
- MZTEK receives a governed OAuth connection
- MZTEK can later use that connection for Google-side source ingestion

## Current Scope

This first-pass API supports:
- health check
- Google OAuth start
- Google OAuth callback
- current session inspection
- Google connection status

It does not yet support:
- NotebookLM direct ingestion
- Drive file listing
- document sync
- persistent session storage

## Endpoints

### `GET /health`
Returns service health.

### `GET /auth/google/start`
Starts Google OAuth using:
- `MZTEK_GOOGLE_CLIENT_ID`
- `MZTEK_GOOGLE_CLIENT_SECRET`
- `MZTEK_GOOGLE_REDIRECT_URI`

### `GET /auth/google/callback`
Exchanges the OAuth code for tokens, fetches the user profile, and creates a
local MZTEK session.

### `GET /me`
Returns the current authenticated session, if present.

### `GET /connectors/google/status`
Returns whether a Google account is connected.

### `GET /connectors/google/notebooklm`
Placeholder route for future NotebookLM-adjacent ingestion strategy.

## Why This Matters for MZTEK

This creates a future-safe path for:
- Google Drive ingestion
- user-owned research document access
- NotebookLM-compatible source workflows
- source-aware idea shaping and notebook building

## Product Truth

MZTEK should prefer user-authorized source access over brittle anonymous-link
scraping when building serious product integrations.
