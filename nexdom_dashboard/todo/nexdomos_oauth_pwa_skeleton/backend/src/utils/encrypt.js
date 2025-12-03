const config = require("../config");

function xorEncrypt(text, key) {
  const tb = Buffer.from(text, "utf8");
  const kb = Buffer.from(key, "utf8");
  const rb = Buffer.alloc(tb.length);
  for (let i = 0; i < tb.length; i++) {
    rb[i] = tb[i] ^ kb[i % kb.length];
  }
  return rb.toString("base64");
}

function xorDecrypt(cipher, key) {
  const cb = Buffer.from(cipher, "base64");
  const kb = Buffer.from(key, "utf8");
  const rb = Buffer.alloc(cb.length);
  for (let i = 0; i < cb.length; i++) {
    rb[i] = cb[i] ^ kb[i % kb.length];
  }
  return rb.toString("utf8");
}

function encrypt(text) {
  return xorEncrypt(text, config.refreshEncryptionKey);
}

function decrypt(cipher) {
  return xorDecrypt(cipher, config.refreshEncryptionKey);
}

module.exports = { encrypt, decrypt };
