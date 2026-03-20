"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage({ onAuth }) {
  const [botInfo, setBotInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/public`)
      .then((r) => r.json())
      .then(setBotInfo)
      .catch(() => setBotInfo({ nickname: "Unknown", ip: "Unknown", status: "disconnected" }));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (data.success) {
        onAuth(password);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Cannot connect to bot API");
    }
    setLoading(false);
  }

  const statusColor =
    botInfo?.status === "connected"
      ? "status-connected"
      : botInfo?.status === "connecting"
      ? "status-connecting"
      : "status-disconnected";

  if (guestMode && botInfo) {
    return (
      <div className="grid-bg min-h-screen flex flex-col items-center justify-center px-4">
        <div className="panel fade-in" style={{ width: "100%", maxWidth: 520 }}>
          <div style={{ padding: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontFamily: "'Share Tech Mono'", color: "var(--accent)", letterSpacing: "0.15em" }}>BOT STATUS</span>
              </div>
              <h1 style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: "1.6rem", color: "var(--accent)", letterSpacing: "0.05em" }}>
                GUEST VIEW
              </h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <InfoRow label="NICKNAME" value={botInfo.nickname} />
              <InfoRow label="SERVER IP" value={botInfo.ip} />
              <InfoRow
                label="STATUS"
                value={
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className={`status-dot ${statusColor}`} />
                    <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.8rem", textTransform: "uppercase" }}>
                      {botInfo.status}
                    </span>
                  </span>
                }
              />
            </div>

            <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "'Share Tech Mono'", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              You are viewing the bot in guest mode. To access full controls, enter the dashboard password.
            </p>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setGuestMode(false)}>
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-bg min-h-screen flex flex-col items-center justify-center px-4">
      <div className="panel fade-in" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ padding: "2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ marginBottom: "0.5rem" }}>
              <span className="mono" style={{ fontSize: "0.6rem", color: "var(--accent)", letterSpacing: "0.2em" }}>
                ◈ MINECRAFT BOT DASHBOARD ◈
              </span>
            </div>
            <h1 style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: "2.2rem", color: "white", letterSpacing: "0.08em", lineHeight: 1 }}>
              MC<span style={{ color: "var(--accent)" }}>_</span>BOT
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.5rem", fontFamily: "'Share Tech Mono'" }}>
              by TerrorAqua
            </p>
          </div>

          {botInfo && (
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)", borderRadius: 3, padding: "0.875rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
                <span className={`status-dot ${statusColor}`} />
                <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "0.1em" }}>BOT ONLINE</span>
              </div>
              <p className="mono" style={{ fontSize: "0.8rem", color: "var(--text)" }}>{botInfo.nickname} @ {botInfo.ip}</p>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--muted)", fontFamily: "'Share Tech Mono'", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                DASHBOARD PASSWORD
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoFocus
              />
            </div>

            {error && (
              <p className="mono" style={{ fontSize: "0.75rem", color: "var(--danger)" }}>⚠ {error}</p>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Authenticating..." : "Access Dashboard →"}
            </button>
          </form>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <button
              className="mono"
              style={{ fontSize: "0.7rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => setGuestMode(true)}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(26,58,92,0.4)" }}>
      <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{label}</span>
      <span className="mono" style={{ fontSize: "0.82rem", color: "var(--text)" }}>{value}</span>
    </div>
  );
}
