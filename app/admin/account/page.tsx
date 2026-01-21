"use client";

import { useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

export default function AdminAccountPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setErr(null);
    setMsg(null);
    if (!oldPassword) return setErr("Нужен старый пароль");
    if (!newLogin && !newPassword) return setErr("Нечего менять");

    setLoading(true);
    try {
      const r = await fetch("/api/auth/admin/change-credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newLogin: newLogin || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const message = data?.error || "Ошибка";
        setErr(message);
        emitAdminToast(message, "error");
        return;
      }
      setMsg("Сохранено");
      emitAdminToast("Данные аккаунта сохранены");
      setOldPassword("");
      setNewLogin("");
      setNewPassword("");
    } catch (error) {
      setErr("Ошибка");
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Аккаунт</h1>
        <p className="admin-subtitle">Смена логина и пароля администратора.</p>
      </div>

      <div className="admin-card stack">
        <label className="admin-field">
          Старый пароль
          <div className="admin-password">
            <input
              className="admin-input"
              placeholder="Старый пароль"
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <button
              type="button"
              className="admin-password__toggle"
              aria-label={showOldPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showOldPassword}
              onClick={() => setShowOldPassword((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                {!showOldPassword && (
                  <path
                    d="M4 4l16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </label>

        <label className="admin-field">
          Новый логин (опционально)
          <input
            className="admin-input"
            placeholder="Новый логин"
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
          />
        </label>

        <label className="admin-field">
          Новый пароль (опционально)
          <div className="admin-password">
            <input
              className="admin-input"
              placeholder="Новый пароль"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="admin-password__toggle"
              aria-label={showNewPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showNewPassword}
              onClick={() => setShowNewPassword((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                {!showNewPassword && (
                  <path
                    d="M4 4l16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </label>

        {err && <div className="text-error">{err}</div>}
        {msg && <div className="text-success">{msg}</div>}

        <button className="admin-button" style={{ width: "100%" }} disabled={loading} onClick={save}>
          {loading ? "..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
