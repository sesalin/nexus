# NexdomOS PWA + HA OAuth Skeleton

This repo is a starting point for the **NexdomOS PWA + Home Assistant OAuth2 (PKCE)** architecture.

> ⚠️ This change is a **PARTEAGUAS**. If this architecture does not work as expected in testing,
> you MUST roll back to the previous ingress-based UI and Caddy config.

## Contents

- `backend/` — Node.js + Express backend:
  - Handles OAuth2 PKCE against Home Assistant
  - Issues internal JWT sessions
  - Stores HA OAuth tokens (encrypted) and NexdomOS users in SQLite
  - Provides basic `/api/auth/*` and `/api/ha/*` endpoints

- `caddy/Caddyfile` — Example Caddy config for a single-tenant NUC.

- `web/` — Minimal PWA shell:
  - `index.html`
  - `manifest.json`
  - `service-worker.js`

- `deploy.sh` — Example deployment script stub for a single tenant.

This skeleton is intentionally small but structured so an IA DEV can extend it safely.
