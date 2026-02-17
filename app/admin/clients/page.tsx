"use client";

import { useEffect, useMemo, useState } from "react";

type ClientRow = {
  id: number;
  posterClientId: string;
  phone: string;
  phoneNormalized: string;
  login: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/clients", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json().catch(() => []);
        if (!r.ok) {
          throw new Error(data?.error || "LOAD_FAILED");
        }
        return Array.isArray(data) ? data : [];
      })
      .then((rows) => {
        setClients(rows as ClientRow[]);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "LOAD_FAILED");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.login, client.phone, client.phoneNormalized, client.posterClientId, String(client.id)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [clients, query]);

  async function deleteClient(client: ClientRow) {
    const agreed = window.confirm(
      `Удалить клиента #${client.id} (${client.phone})? Это действие нельзя отменить.`
    );
    if (!agreed) return;

    setDeletingId(client.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients?id=${client.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "DELETE_FAILED");
      }
      setClients((prev) => prev.filter((row) => row.id !== client.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Клиенты</h1>
        <p className="admin-subtitle">
          Список всех зарегистрированных клиентов. В таблице показан дополнительный SHA-256 хэш от сохраненного пароля.
        </p>
      </div>

      <div className="admin-inline">
        <input
          className="admin-input"
          style={{ maxWidth: 360 }}
          placeholder="Поиск по ID, телефону, логину"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="admin-pill">Всего: {filtered.length}</div>
      </div>

      {loading ? (
        <section className="admin-card">Загрузка...</section>
      ) : error ? (
        <section className="admin-card text-error">Ошибка загрузки: {error}</section>
      ) : filtered.length ? (
        <section className="stack">
          {filtered.map((client) => (
            <div key={client.id} className="admin-card stack">
              <div className="admin-inline">
                <div style={{ fontWeight: 700 }}>#{client.id}</div>
                <div className="admin-pill">Poster ID: {client.posterClientId}</div>
              </div>
              <div className="admin-grid">
                <label className="admin-field">
                  Логин
                  <input className="admin-input" value={client.login || client.phone} readOnly />
                </label>
                <label className="admin-field">
                  Телефон
                  <input className="admin-input" value={client.phone} readOnly />
                </label>
              </div>
              <label className="admin-field">
                Пароль (hash, SHA-256)
                <textarea
                  className="admin-textarea"
                  style={{ minHeight: 76, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                  value={client.passwordHash}
                  readOnly
                />
              </label>
              <div className="admin-subtitle">
                Создан: {formatDate(client.createdAt)} | Обновлён: {formatDate(client.updatedAt)}
              </div>
              <div className="admin-inline">
                <button
                  className="admin-button admin-button-muted"
                  onClick={() => deleteClient(client)}
                  disabled={deletingId === client.id}
                >
                  {deletingId === client.id ? "Удаление..." : "Удалить клиента"}
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="admin-card">Клиенты не найдены.</section>
      )}
    </div>
  );
}
