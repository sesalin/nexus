# Change Request — NexdomOS PWA + HA OAuth (PARTEAGUAS)

## Intent

Migrate NexdomOS from an ingress-embedded UI to a **top-level PWA** that uses
**Home Assistant as the identity provider (OAuth2 + PKCE)**, while NexdomOS
adds its own internal roles, geofencing and per-user AdGuard logic via JWT.

If this change fails any critical test (auth, PWA install, token safety), we
rollback entirely to the previous stack.

## Critical Requirements

1. Home Assistant remains the **authority of identity** (passwords, MFA, user roles).
2. The NexdomOS dashboard is served as a PWA outside ingress (top-level origin).
3. The backend issues **internal JWT** sessions derived from HA OAuth tokens.
4. A **Long-Lived Token (LLT)** is stored only in `/data/secrets/ha_token` and
   never exposed to the browser.
5. The only unauthenticated routes are the minimal PWA artifacts
   (manifest, service worker, icons). Everything else is protected.
6. Rollback must be possible within minutes by restoring the previous
   Caddy/add-on config.

See `backend/src` and `caddy/Caddyfile` for initial implementation.
