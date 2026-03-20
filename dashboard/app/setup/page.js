"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SetupPage({ password, onDone, onLogout }) {
  const [form, setForm] = useState({
    botHost: "",
    botPort: "25565",
    botUsername: "",
    botPasswordIngame: "",
    repoUrl: "",
    dashboardUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.botHost || !form.botUsername) {
      setError("Server IP and Bot Username are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, ...form }),
      });
      const d = await r.json();
      if (d.success) {
        onDone();
      } else {
        setError(d.message || "Failed to save config.");
      }
    } catch {
      setError("Cannot connect to bot API.");
    }
    setSaving(false);
  }

  return (
    <div className="grid-bg min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="panel fade-in" style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ padding: "2rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <span className="mono" style={{ fontSize: "0.6rem", color: "var(--accent)", letterSpacing: "0.2em" }}>
              ◈ FIRST TIME SETUP ◈
            </span>
            <h1 style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: "2rem", color: "white", letterSpacing: "0.06em", marginTop: "0.4rem" }}>
              Configure Your Bot
            </h1>
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
              Fill in the settings below. You can change them later from the dashboard.
            </p>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            <Section label="SERVER">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "0.75rem" }}>
                <Field label="SERVER IP" placeholder="play.example.com" value={form.botHost} onChange={(v) => set("botHost", v)} required />
                <Field label="PORT" placeholder="25565" value={form.botPort} onChange={(v) => set("botPort", v)} />
              </div>
            </Section>

            <Section label="BOT">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Field label="USERNAME" placeholder="MyBot" value={form.botUsername} onChange={(v) => set("botUsername", v)} required />
                <Field label="IN-GAME PASSWORD" placeholder="Used for /register and /login (optional)" value={form.botPasswordIngame} onChange={(v) => set("botPasswordIngame", v)} type="password" />
              </div>
            </Section>

            <Section label="LINKS">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Field label="REPO URL" placeholder="https://github.com/you/mc-bot" value={form.repoUrl} onChange={(v) => set("repoUrl", v)} />
                <Field label="DASHBOARD URL" placeholder="https://mc-bot.fly.dev (your app URL)" value={form.dashboardUrl} onChange={(v) => set("dashboardUrl", v)} />
              </div>
            </Section>

            {error && (
              <p className="mono" style={{ fontSize: "0.75rem", color: "var(--danger)" }}>⚠ {error}</p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={saving}>
                {saving ? "Saving..." : "Save & Start Bot →"}
              </button>
              <button type="button" className="btn btn-danger" style={{ padding: "0.5rem 1rem" }} onClick={onLogout}>
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="mono" style={{ fontSize: "0.6rem", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
        {label}
      </p>
      <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)", borderRadius: 3, padding: "1rem" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text", required }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.62rem", color: "var(--muted)", fontFamily: "'Share Tech Mono'", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
        {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
      </label>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
