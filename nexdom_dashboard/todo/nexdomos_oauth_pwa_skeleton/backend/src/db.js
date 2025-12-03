const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const config = require("./config");

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(config.dbPath);

const db = new sqlite3.Database(config.dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ha_user_id TEXT UNIQUE,
    display_name TEXT,
    email TEXT,
    roles TEXT,
    geo_config TEXT,
    adguard_profile TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ha_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ha_user_id TEXT UNIQUE,
    access_token TEXT,
    refresh_token_enc TEXT,
    expires_at INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
