require("dotenv").config({ path: "../.env" });
const mineflayer = require("mineflayer");
const express = require("express");
const cors = require("cors");

const BOT_HOST = process.env.BOT_HOST || "localhost";
const BOT_PORT = parseInt(process.env.BOT_PORT) || 25565;
const BOT_USERNAME = process.env.BOT_USERNAME || "TerrorAquaBot";
const BOT_PASSWORD_INGAME = process.env.BOT_PASSWORD_INGAME || "";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "admin";
const API_PORT = parseInt(process.env.PORT || process.env.API_PORT) || 10000;
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3000";
const REPO_URL = process.env.REPO_URL || "https://github.com/TerrorAqua/mc-bot";

let bot = null;
let status = "disconnected";
let reconnectTimer = null;
let hourTimer = null;
let sessionStart = null;
let logs = [];

function addLog(msg) {
  const entry = { time: new Date().toISOString(), message: msg };
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();
  console.log(`[${entry.time}] ${msg}`);
}

function createBot() {
  if (bot) {
    try { bot.quit(); } catch (_) {}
    bot = null;
  }

  clearTimeout(reconnectTimer);
  clearTimeout(hourTimer);

  status = "connecting";
  addLog(`Connecting to ${BOT_HOST}:${BOT_PORT} as ${BOT_USERNAME}...`);

  bot = mineflayer.createBot({
    host: BOT_HOST,
    port: BOT_PORT,
    username: BOT_USERNAME,
    version: "1.21.1",
    auth: "offline",
  });

  bot.once("spawn", () => {
    status = "connected";
    sessionStart = Date.now();
    addLog("Bot spawned successfully.");

    setTimeout(() => {
      sendWelcome();
    }, 2000);

    hourTimer = setInterval(() => {
      if (bot && status === "connected") {
        bot.chat("This bot created by TerrorAqua | Repo: " + REPO_URL + " | Dashboard: " + DASHBOARD_URL);
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
    clearTimeout(hourTimer);
    addLog(`Disconnected: ${reason}`);
    scheduleReconnect();
  });
}

function sendWelcome() {
  if (!bot || status !== "connected") return;
  const lines = [
    "This bot created by TerrorAqua",
    "Repository: " + REPO_URL,
    "Dashboard: " + DASHBOARD_URL,
  ];
  if (BOT_PASSWORD_INGAME) {
    setTimeout(() => { try { bot.chat("/register " + BOT_PASSWORD_INGAME + " " + BOT_PASSWORD_INGAME); } catch (_) {} }, 500);
    setTimeout(() => { try { bot.chat("/login " + BOT_PASSWORD_INGAME); } catch (_) {} }, 1500);
  }
  lines.forEach((line, i) => {
    setTimeout(() => {
      try { bot.chat(line); } catch (_) {}
    }, 3000 + i * 1000);
  });
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  clearTimeout(hourTimer);
  reconnectTimer = setTimeout(() => {
    addLog("Reconnecting...");
    createBot();
  }, 5000);
}

createBot();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/public", (req, res) => {
  res.json({
    nickname: BOT_USERNAME,
    ip: BOT_HOST + ":" + BOT_PORT,
    status,
  });
});

app.post("/api/auth", (req, res) => {
  const { password } = req.body;
  if (password === DASHBOARD_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Wrong password" });
  }
});

app.post("/api/chat", (req, res) => {
  const { password, message } = req.body;
  if (password !== DASHBOARD_PASSWORD) return res.status(401).json({ success: false });
  if (!bot || status !== "connected") return res.status(400).json({ success: false, message: "Bot not connected" });
  try {
    bot.chat(message);
    addLog(`[DASHBOARD CHAT] ${message}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/reconnect", (req, res) => {
  const { password } = req.body;
  if (password !== DASHBOARD_PASSWORD) return res.status(401).json({ success: false });
  addLog("Manual reconnect triggered from dashboard.");
  createBot();
  res.json({ success: true });
});

app.get("/api/logs", (req, res) => {
  const { password } = req.query;
  if (password !== DASHBOARD_PASSWORD) return res.status(401).json({ success: false });
  res.json({ logs });
});

app.get("/api/config", (req, res) => {
  const { password } = req.query;
  if (password !== DASHBOARD_PASSWORD) return res.status(401).json({ success: false });
  res.json({
    nickname: BOT_USERNAME,
    ip: BOT_HOST,
    port: BOT_PORT,
    status,
    repoUrl: REPO_URL,
    dashboardUrl: DASHBOARD_URL,
    ingamePasswordSet: !!BOT_PASSWORD_INGAME,
  });
});

app.listen(API_PORT, () => {
  addLog(`API server running on port ${API_PORT}`);
});
