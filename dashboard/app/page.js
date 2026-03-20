"use client";
import { useEffect, useState } from "react";
import LoginPage from "./login/page";
import DashboardPage from "./dashboard/page";

export default function Home() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("mc_bot_auth");
    setAuth(saved || null);
  }, []);

  if (auth === null) return null;

  if (!auth) return <LoginPage onAuth={(p) => { sessionStorage.setItem("mc_bot_auth", p); setAuth(p); }} />;
  return <DashboardPage password={auth} onLogout={() => { sessionStorage.removeItem("mc_bot_auth"); setAuth(null); }} />;
}
