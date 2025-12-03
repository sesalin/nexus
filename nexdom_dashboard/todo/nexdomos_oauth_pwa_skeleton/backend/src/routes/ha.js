const express = require("express");
const fs = require("fs");
const axios = require("axios");
const config = require("../config");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function readLLT() {
  try {
    const token = fs.readFileSync(config.lltPath, "utf8").trim();
    return token || null;
  } catch {
    return null;
  }
}

router.get("/states", requireAuth, async (req, res) => {
  const llt = readLLT();
  if (!llt) return res.status(500).json({ error: "missing_llt" });
  try {
    const resp = await axios.get(config.ha.baseUrl + "/api/states", {
      headers: { Authorization: `Bearer ${llt}` }
    });
    res.json(resp.data);
  } catch (err) {
    console.error("HA states error:", err.response?.data || err.message);
    res.status(500).json({ error: "ha_states_failed" });
  }
});

module.exports = router;
