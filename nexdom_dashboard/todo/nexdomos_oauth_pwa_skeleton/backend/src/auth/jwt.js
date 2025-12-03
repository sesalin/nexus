const jwt = require("jsonwebtoken");
const config = require("../config");

function signSession(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpirySeconds });
}

function signRefresh(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.refreshJwtExpirySeconds });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signSession, signRefresh, verifyToken };
