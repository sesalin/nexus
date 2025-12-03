const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const db = require("../db");
const config = require("../config");
const { generateCodeVerifier, generateCodeChallenge } = require("../utils/pkce");
const { encrypt } = require("../utils/encrypt");
const { signSession, signRefresh, verifyToken } = require("../auth/jwt");

const router = express.Router();
router.use(cookieParser());

const pkceStore = new Map();

router.get("/session", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.json({ authenticated: false });
  try {
    const payload = verifyToken(token);
    return res.json({ authenticated: true, user: payload });
  } catch {
    return res.json({ authenticated: false });
  }
});

router.get("/ha/login", (req, res) => {
  const state = Math.random().toString(36).slice(2);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  pkceStore.set(state, { codeVerifier, createdAt: Date.now() });

  const url = new URL(config.ha.oauthAuthorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.ha.clientId);
  url.searchParams.set("redirect_uri", config.ha.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", config.ha.scope);

  res.json({ redirectTo: url.toString() });
});

router.get("/ha/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).json({ error: "missing_code_or_state" });

  const entry = pkceStore.get(state);
  if (!entry) return res.status(400).json({ error: "invalid_state" });
  pkceStore.delete(state);

  try {
    const tokenResp = await axios.post(config.ha.oauthTokenUrl, new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.ha.clientId,
      client_secret: config.ha.clientSecret,
      redirect_uri: config.ha.redirectUri,
      code_verifier: entry.codeVerifier
    }).toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

    const { access_token, refresh_token, expires_in } = tokenResp.data;

    const meResp = await axios.get(config.ha.baseUrl + "/api/config", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const haUserId = meResp.data?.location_name || "ha_user";

    db.serialize(() => {
      db.run(`INSERT INTO users (ha_user_id, display_name, roles)
              VALUES (?, ?, ?)
              ON CONFLICT(ha_user_id) DO UPDATE SET
                display_name=excluded.display_name,
                updated_at=CURRENT_TIMESTAMP`,
        [haUserId, meResp.data.location_name || "Nexdom User", JSON.stringify(["owner"])]
      );

      db.run(`INSERT INTO ha_tokens (ha_user_id, access_token, refresh_token_enc, expires_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(ha_user_id) DO UPDATE SET
                access_token=excluded.access_token,
                refresh_token_enc=excluded.refresh_token_enc,
                expires_at=excluded.expires_at,
                updated_at=CURRENT_TIMESTAMP`,
        [haUserId, access_token, encrypt(refresh_token), Math.floor(Date.now() / 1000) + (expires_in || 900)]
      );
    });

    const sessionPayload = { ha_user_id: haUserId, roles: ["owner"] };
    const sessionJwt = signSession(sessionPayload);
    const refreshJwt = signRefresh({ ha_user_id: haUserId });

    res.json({ ok: true, sessionJwt, refreshJwt, user: sessionPayload });
  } catch (err) {
    console.error("HA OAuth callback error:", err.response?.data || err.message);
    return res.status(500).json({ error: "oauth_exchange_failed" });
  }
});

router.post("/refresh", (req, res) => {
  const { refreshJwt } = req.body || {};
  if (!refreshJwt) return res.status(400).json({ error: "missing_refresh_token" });
  try {
    const payload = verifyToken(refreshJwt);
    const sessionJwt = signSession({ ha_user_id: payload.ha_user_id, roles: payload.roles || ["owner"] });
    return res.json({ ok: true, sessionJwt });
  } catch {
    return res.status(401).json({ error: "invalid_refresh_token" });
  }
});

router.post("/logout", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
