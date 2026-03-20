"use client";
import { useEffect, useState } from "react";
import LoginPage from "./login/page";
import DashboardPage from "./dashboard/page";
import SetupPage from "./setup/page";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [auth, setAuth] = useState(null);
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("mc_bot_auth");
    fetch(`${API}/api/public`)
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setAuth(saved || null);
      })
      .catch(() => {
        setConfigured(true);
        setAuth(saved || null);
      });
  }, []);

  if (auth === null || configured === null) return null;

  if (auth && !configured) {
    return (
      <SetupPage
        password={auth}
        onDone={() => setConfigured(true)}
        onLogout={() => { sessionStorage.removeItem("mc_bot_auth"); setAuth(null); }}
      />
    );
  }

  if (!auth) {
    return (
      <LoginPage
        onAuth={(p) => { sessionStorage.setItem("mc_bot_auth", p); setAuth(p); }}
      />
    );
  }

  return (
    <DashboardPage
      password={auth}
      onLogout={() => { sessionStorage.removeItem("mc_bot_auth"); setAuth(null); }}
    />
  );
}
