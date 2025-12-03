module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpirySeconds: 15 * 60,
  refreshJwtExpirySeconds: 30 * 24 * 60 * 60,
  dbPath: process.env.DB_PATH || "/data/db/users.sqlite",
  refreshEncryptionKey: process.env.REFRESH_ENC_KEY || "replace-this-with-a-strong-key",
  ha: {
    baseUrl: process.env.HA_BASE_URL || "http://supervisor/core",
    oauthAuthorizeUrl: process.env.HA_AUTH_URL || "http://homeassistant.local:8123/auth/authorize",
    oauthTokenUrl: process.env.HA_TOKEN_URL || "http://homeassistant.local:8123/auth/token",
    clientId: process.env.HA_CLIENT_ID || "http://nexdomos.local",
    clientSecret: process.env.HA_CLIENT_SECRET || "change-me",
    redirectUri: process.env.HA_REDIRECT_URI || "https://nexdomos.local/api/auth/ha/callback",
    scope: process.env.HA_SCOPE || "openid profile"
  },
  lltPath: process.env.LLT_PATH || "/data/secrets/ha_token"
};
