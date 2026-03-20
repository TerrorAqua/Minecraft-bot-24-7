require("dotenv").config({ path: "../.env" });
const mineflayer = require("mineflayer");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "admin";
const API_PORT = parseInt(process.env.PORT || process.env.API_PORT) || 3001;

let config = {
  botHost: "",
  botPort: 25565,
  botUsername: "McBot",
  botPasswordIngame: "",
  repoUrl: "",
  dashboardUrl: "",
};

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      config = { ...config, ...data };
    } catch (_) {}
  }
}

function saveConfig(data) {
  config = { ...config, ...data };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function isConfigured() {
  return !!(config.botHost && config.botUsername);
}

loadConfig();

let bot = null;
let status = "disconnected";
let reconnectTimer = null;
let hourTimer = null;
let logs = [];

function addLog(msg) {
  const entry = { time: new Date().toISOString(), message: msg };
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();
  console.log(`[${entry.time}] ${msg}`);
}

function stopBot() {
  clearTimeout(reconnectTimer);
  clearInterval(hourTimer);
  if (bot) {
    try { bot.quit(); } catch (_) {}
    bot = null;
  }
  status = "disconnected";
}

function createBot() {
  stopBot();
  if (!isConfigured()) {
    addLog("Bot not configured yet. Fill in settings from the dashboard.");
    return;
  }

  status = "connecting";
  addLog(`Connecting to ${config.botHost}:${config.botPort} as ${config.botUsername}...`);

  bot = mineflayer.createBot({
    host: config.botHost,
    port: Number(config.botPort),
    username: config.botUsername,
    version: "1.21.11",
    auth: "offline",
  });

  bot.once("spawn", () => {
    status = "connected";
    addLog("Bot spawned successfully.");
    setTimeout(() => sendWelcome(), 2000);

    hourTimer = setInterval(() => {
      if (bot && status === "connected") {
        bot.chat("This bot created by TerrorAqua | Repo: " + config.repoUrl + " | Dashboard: " + config.dashboardUrl);
        addLog("Sent hourly welcome message.");
      }
    }, 60 * 60 * 1000);

    reconnectTimer = setTimeout(() => {
      addLog("10-minute reconnect cycle triggered.");
      createBot();
    }, 10 * 60 * 1000);
  });

  bot.on("chat", (username, message) => {
    addLog(`[CHAT] ${username}: ${message}`);
  });

  bot.on("error", (err) => {
    status = "disconnected";
    addLog(`Error: ${err.message}`);
    scheduleReconnect();
  });

  bot.on("end", (reason) => {
    status = "disconnected";
    clearInterval(hourTimer);
    addLog(`Disconnected: ${reason}`);
    scheduleReconnect();
  });
}

function sendWelcome() {
  if (!bot || status !== "connected") return;
  if (config.botPasswordIngame) {
    setTimeout(() => { try { bot.chat("/register " + config.botPasswordIngame + " " + config.botPasswordIngame); } catch (_) {} }, 500);
    setTimeout(() => { try { bot.chat("/login " + config.botPasswordIngame); } catch (_) {} }, 1500);
  }
  const lines = [
    "This bot created by TerrorAqua",
    "Repository: " + config.repoUrl,
    "Dashboard: " + config.dashboardUrl,
  ];
  lines.forEach((line, i) => {
    setTimeout(() => { try { bot.chat(line); } catch (_) {} }, 3000 + i * 1000);
  });
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  clearInterval(hourTimer);
  reconnectTimer = setTimeout(() => {
    addLog("Reconnecting...");
    createBot();
  }, 5000);
}

createBot();

const app = express();
app.use(cors());
app.use(express.json());

function checkAuth(req, res) {
  const pw = req.body?.password || req.query?.password;
  if (pw !== DASHBOARD_PASSWORD) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return false;
  }
  return true;
}

app.get("/api/public", (req, res) => {
  res.json({
    nickname: config.botUsername,
    ip: config.botHost + ":" + config.botPort,
    status,
    configured: isConfigured(),
  });
});

app.post("/api/auth", (req, res) => {
  if (req.body?.password === DASHBOARD_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Wrong password" });
  }
});

app.get("/api/config", (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json({ ...config, status, configured: isConfigured() });
});

app.post("/api/config", (req, res) => {
  if (!checkAuth(req, res)) return;
  const { botHost, botPort, botUsername, botPasswordIngame, repoUrl, dashboardUrl } = req.body;
  saveConfig({ botHost, botPort: Number(botPort) || 25565, botUsername, botPasswordIngame, repoUrl, dashboardUrl });
  addLog("Config updated from dashboard. Restarting bot...");
  createBot();
  res.json({ success: true });
});

app.post("/api/chat", (req, res) => {
  if (!checkAuth(req, res)) return;
  if (!bot || status !== "connected") return res.status(400).json({ success: false, message: "Bot not connected" });
  try {
    bot.chat(req.body.message);
    addLog(`[DASHBOARD CHAT] ${req.body.message}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/reconnect", (req, res) => {
  if (!checkAuth(req, res)) return;
  addLog("Manual reconnect triggered from dashboard.");
  createBot();
  res.json({ success: true });
});

app.get("/api/logs", (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json({ logs });
});

app.listen(API_PORT, () => {
  addLog(`API server running on port ${API_PORT}`);
});
