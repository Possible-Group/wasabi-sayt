"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) return setErr(data?.error || "Ошибка");
      router.replace(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-card stack" style={{ maxWidth: 360, width: "100%" }}>
      <div className="stack">
        <div style={{ fontSize: 20, fontWeight: 600 }}>Вход в админку</div>
        <div className="admin-subtitle">Введите логин и пароль администратора.</div>
      </div>

      <label className="admin-field">
        Логин
        <input
          className="admin-input"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Логин"
        />
      </label>
      <label className="admin-field">
        Пароль
        <input
          className="admin-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          type="password"
        />
      </label>

      {err && <div className="text-error">{err}</div>}

      <button className="admin-button" style={{ width: "100%" }} disabled={loading} onClick={submit}>
        {loading ? "..." : "Войти"}
      </button>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
