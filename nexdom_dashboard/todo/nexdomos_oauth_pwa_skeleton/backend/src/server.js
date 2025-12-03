const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config");
const authRoutes = require("./routes/auth");
const haRoutes = require("./routes/ha");

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use("/api/auth", authRoutes);
app.use("/api/ha", haRoutes);

app.use("/app", express.static(path.join(__dirname, "../../web")));

app.listen(config.port, () => {
  console.log(`NexdomOS backend listening on port ${config.port}`);
});
