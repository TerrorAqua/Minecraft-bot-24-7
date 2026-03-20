"use client";
import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage({ password, onLogout }) {
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [chatMsg, setChatMsg] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [reconnecting, setReconnecting] = useState(false);
  const [tab, setTab] = useState("overview");
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  async function fetchConfig() {
    try {
      const r = await fetch(`${API}/api/config?password=${encodeURIComponent(password)}`);
      const d = await r.json();
      if (d.success === false) { onLogout(); return; }
      setConfig(d);
      if (!settings) {
        setSettings({
          botHost: d.botHost || "",
          botPort: String(d.botPort || "25565"),
          botUsername: d.botUsername || "",
          botPasswordIngame: d.botPasswordIngame || "",
          repoUrl: d.repoUrl || "",
          dashboardUrl: d.dashboardUrl || "",
        });
      }
    } catch {}
  }

  async function fetchLogs() {
    try {
      const r = await fetch(`${API}/api/logs?password=${encodeURIComponent(password)}`);
      const d = await r.json();
      if (d.logs) setLogs(d.logs);
    } catch {}
  }

  useEffect(() => {
    fetchConfig();
    fetchLogs();
    const iv = setInterval(() => { fetchConfig(); fetchLogs(); }, 4000);
    return () => clearInterval(iv);
  }, []);

  async function sendChat(e) {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    setChatStatus("sending");
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, message: chatMsg }),
      });
      const d = await r.json();
      if (d.success) { setChatMsg(""); setChatStatus("sent"); setTimeout(() => setChatStatus(""), 2000); }
      else setChatStatus("error: " + (d.message || "failed"));
    } catch { setChatStatus("connection error"); }
  }

  async function handleReconnect() {
    setReconnecting(true);
    try {
      await fetch(`${API}/api/reconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
    } catch {}
    setTimeout(() => { setReconnecting(false); fetchConfig(); }, 2000);
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      const r = await fetch(`${API}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, ...settings }),
      });
      const d = await r.json();
      if (d.success) {
        setSettingsMsg("✓ Saved. Bot is restarting...");
        setTimeout(() => { setSettingsMsg(""); fetchConfig(); }, 3000);
      } else {
        setSettingsMsg("⚠ " + (d.message || "Failed to save."));
      }
    } catch {
      setSettingsMsg("⚠ Connection error.");
    }
    setSavingSettings(false);
  }

  function setSetting(key, val) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  const statusColor =
    config?.status === "connected" ? "status-connected" :
    config?.status === "connecting" ? "status-connecting" : "status-disconnected";

  const statusHex =
    config?.status === "connected" ? "var(--accent2)" :
    config?.status === "connecting" ? "var(--warn)" : "var(--danger)";

  const TABS = ["overview", "settings", "logs", "chat"];

  return (
    <div className="grid-bg min-h-screen" style={{ paddingBottom: "2rem" }}>
      <header style={{
        background: "rgba(5,10,14,0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: "1.3rem", color: "white", letterSpacing: "0.1em" }}>
            MC<span style={{ color: "var(--accent)" }}>_</span>BOT
          </span>

          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? "rgba(0,212,255,0.1)" : "transparent",
                border: tab === t ? "1px solid var(--accent)" : "1px solid transparent",
                color: tab === t ? "var(--accent)" : "var(--muted)",
                fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: "0.78rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "0.3rem 0.8rem", borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
              }}>
                {t}
              </button>
            ))}
          </nav>

          <button className="btn btn-danger" style={{ fontSize: "0.7rem", padding: "0.3rem 0.8rem" }} onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>

        {tab === "overview" && (
          <div className="fade-in" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <div className="panel" style={{ padding: "1.5rem" }}>
              <p className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "1rem" }}>BOT STATUS</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <span className={`status-dot ${statusColor}`} style={{ width: 12, height: 12 }} />
                <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: "1.4rem", color: statusHex, letterSpacing: "0.1em" }}>
                  {config?.status?.toUpperCase() || "LOADING"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <StatRow label="Nickname" value={config?.botUsername} />
                <StatRow label="Server" value={config?.botHost} />
                <StatRow label="Port" value={config?.botPort} />
                <StatRow label="Version" value="1.21.11" />
              </div>
            </div>

            <div className="panel" style={{ padding: "1.5rem" }}>
              <p className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "1rem" }}>QUICK ACTIONS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button className="btn btn-success" style={{ width: "100%" }} onClick={handleReconnect} disabled={reconnecting}>
                  {reconnecting ? "Reconnecting..." : "⟳ Force Reconnect"}
                </button>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setTab("settings")}>
                  ⚙ Edit Settings
                </button>
                <p className="mono" style={{ fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.6 }}>
                  Auto-reconnects every 10 min. Hourly message every 60 min.
                </p>
              </div>
            </div>

            <div className="panel" style={{ padding: "1.5rem" }}>
              <p className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "1rem" }}>LINKS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <LinkRow label="Repository" value={config?.repoUrl} />
                <LinkRow label="Dashboard" value={config?.dashboardUrl} />
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && settings && (
          <div className="panel fade-in" style={{ padding: "1.5rem", maxWidth: 560 }}>
            <p className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "1.5rem" }}>BOT SETTINGS</p>
            <form onSubmit={saveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              <SettingsSection label="SERVER">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "0.75rem" }}>
                  <SettingField label="SERVER IP" value={settings.botHost} onChange={(v) => setSetting("botHost", v)} placeholder="play.example.com" required />
                  <SettingField label="PORT" value={settings.botPort} onChange={(v) => setSetting("botPort", v)} placeholder="25565" />
                </div>
              </SettingsSection>

              <SettingsSection label="BOT">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <SettingField label="USERNAME" value={settings.botUsername} onChange={(v) => setSetting("botUsername", v)} placeholder="MyBot" required />
                  <SettingField label="IN-GAME PASSWORD" value={settings.botPasswordIngame} onChange={(v) => setSetting("botPasswordIngame", v)} placeholder="For /register and /login (optional)" type="password" />
                </div>
              </SettingsSection>

              <SettingsSection label="LINKS">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <SettingField label="REPO URL" value={settings.repoUrl} onChange={(v) => setSetting("repoUrl", v)} placeholder="https://github.com/you/mc-bot" />
                  <SettingField label="DASHBOARD URL" value={settings.dashboardUrl} onChange={(v) => setSetting("dashboardUrl", v)} placeholder="https://mc-bot.fly.dev" />
                </div>
              </SettingsSection>

              {settingsMsg && (
                <p className="mono" style={{ fontSize: "0.75rem", color: settingsMsg.startsWith("✓") ? "var(--accent2)" : "var(--danger)" }}>
                  {settingsMsg}
                </p>
              )}

              <button type="submit" className="btn btn-success" style={{ width: "100%" }} disabled={savingSettings}>
                {savingSettings ? "Saving..." : "Save & Restart Bot →"}
              </button>
            </form>
          </div>
        )}

        {tab === "logs" && (
          <div className="panel fade-in" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <p className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em" }}>
                ACTIVITY LOGS <span style={{ color: "var(--accent)" }}>({logs.length})</span>
              </p>
              <button className="btn btn-primary" style={{ fontSize: "0.65rem", padding: "0.25rem 0.6rem" }} onClick={fetchLogs}>Refresh</button>
            </div>
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {logs.length === 0 ? (
                <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>No logs yet.</p>
              ) : logs.map((l, i) => (
                <div key={i} className="log-entry">
                  <span className="time">{l.time.slice(11, 19)}</span>
                  <span className="msg">{l.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div className="panel fade-in" style={{ padding: "1.5rem", maxWidth: 600 }}>
            <p className="mono" style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "1.5rem" }}>SEND CHAT MESSAGE</p>
            <form onSubmit={sendChat} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", color: "var(--muted)", fontFamily: "'Share Tech Mono'", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>MESSAGE</label>
                <input className="input-field" placeholder="Type a message to send in-game..." value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-success" disabled={!chatMsg.trim() || config?.status !== "connected"}>
                Send Message →
              </button>
              {chatStatus && (
                <p className="mono" style={{ fontSize: "0.75rem", color: chatStatus === "sent" ? "var(--accent2)" : "var(--danger)" }}>
                  {chatStatus === "sent" ? "✓ Message sent" : "⚠ " + chatStatus}
                </p>
              )}
              {config?.status !== "connected" && (
                <p className="mono" style={{ fontSize: "0.72rem", color: "var(--warn)" }}>Bot is not connected. Chat is disabled.</p>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid rgba(26,58,92,0.35)" }}>
      <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{label}</span>
      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--text)" }}>{value || "—"}</span>
    </div>
  );
}

function LinkRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(26,58,92,0.35)" }}>
      <span className="mono" style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{label}</span>
      {value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", wordBreak: "break-all" }}>
          {value}
        </a>
      ) : (
        <span className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>—</span>
      )}
    </div>
  );
}

function SettingsSection({ label, children }) {
  return (
    <div>
      <p className="mono" style={{ fontSize: "0.6rem", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>{label}</p>
      <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)", borderRadius: 3, padding: "1rem" }}>
        {children}
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.62rem", color: "var(--muted)", fontFamily: "'Share Tech Mono'", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
        {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
      </label>
      <input className="input-field" type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
