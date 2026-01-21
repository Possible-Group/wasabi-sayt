"use client";

import { useEffect, useMemo, useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

type PosterCategory = {
  category_id?: string | null;
  category_name?: string | null;
  category_photo?: string | null;
  photo?: string | null;
};

type CatRow = {
  categoryId: string;
  nameUz?: string | null;
  seoTitleRu?: string | null;
  seoDescRu?: string | null;
  seoKeywordsRu?: string | null;
  seoTitleUz?: string | null;
  seoDescUz?: string | null;
  seoKeywordsUz?: string | null;
};

function normalizeText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

export default function AdminCategoriesPage() {
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<PosterCategory[]>([]);
  const [trs, setTrs] = useState<Record<string, CatRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/poster/categories?include_hidden=1").then((r) => r.json()).then(setCategories);
    fetch("/api/admin/category-translations")
      .then((r) => r.json())
      .then((rows: CatRow[]) => {
        const map: Record<string, CatRow> = {};
        rows.forEach((x) => (map[x.categoryId] = x));
        setTrs(map);
      });
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return categories;
    return categories.filter((c) =>
      normalizeText(c.category_name ?? "").toLowerCase().includes(qq)
    );
  }, [categories, q]);

  function updateTr(categoryId: string, patch: Partial<CatRow>) {
    setTrs((prev) => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] || { categoryId }), ...patch },
    }));
  }

  async function save(categoryId: string) {
    setSavingId(categoryId);
    try {
      const row = trs[categoryId] || { categoryId };
      const r = await fetch("/api/admin/category-translations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categoryId,
          nameUz: row.nameUz || "",
          seoTitleRu: row.seoTitleRu || "",
          seoDescRu: row.seoDescRu || "",
          seoKeywordsRu: row.seoKeywordsRu || "",
          seoTitleUz: row.seoTitleUz || "",
          seoDescUz: row.seoDescUz || "",
          seoKeywordsUz: row.seoKeywordsUz || "",
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setTrs((p) => ({ ...p, [categoryId]: data.row }));
      }
      emitAdminToast("Категория сохранена");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Категории</h1>
        <p className="admin-subtitle">Переводы категорий на узбекский и SEO для RU и UZ.</p>
      </div>

      <div className="admin-inline">
        <input
          className="admin-input"
          placeholder="Поиск категории (RU)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <div className="admin-pill">Всего: {filtered.length}</div>
      </div>

      <div className="stack">
        {filtered.map((c) => {
          const id = normalizeText(c.category_id ?? "");
          const nameRu = normalizeText(c.category_name ?? "");
          const photo = c.photo || c.category_photo || "";
          const tr = trs[id] || { categoryId: id };

          return (
            <div key={id} className="admin-card stack">
              <div className="admin-inline">
                <div className="admin-subtitle">ID: {id}</div>
              </div>

              <div className="admin-grid">
                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 600 }}>RU (из Poster)</div>
                  <div className="admin-media">
                    <div className="admin-thumb">
                      {photo ? (
                        <img src={photo} alt={nameRu} loading="lazy" />
                      ) : (
                        <div className="admin-thumb__empty">Нет фото</div>
                      )}
                    </div>
                    <div className="stack">
                      <div style={{ fontWeight: 600 }}>{nameRu || "Без названия"}</div>
                      <div className="admin-subtitle">Категория из Poster</div>
                    </div>
                  </div>
                </div>

                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 600 }}>UZ (заполняем)</div>
                  <label className="admin-field">
                    Название (UZ)
                    <input
                      className="admin-input"
                      placeholder="Название (UZ)"
                      value={tr.nameUz || ""}
                      onChange={(e) => updateTr(id, { nameUz: e.target.value })}
                    />
                  </label>

                  <div className="admin-divider" />
                  <div style={{ fontWeight: 600 }}>SEO (RU)</div>
                  <label className="admin-field">
                    Meta title (RU)
                    <input
                      className="admin-input"
                      placeholder="Meta title (RU)"
                      value={tr.seoTitleRu || ""}
                      onChange={(e) => updateTr(id, { seoTitleRu: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Meta description (RU)
                    <textarea
                      className="admin-textarea"
                      placeholder="Meta description (RU)"
                      value={tr.seoDescRu || ""}
                      onChange={(e) => updateTr(id, { seoDescRu: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Meta keywords (RU)
                    <input
                      className="admin-input"
                      placeholder="ключ1, ключ2, ключ3"
                      value={tr.seoKeywordsRu || ""}
                      onChange={(e) => updateTr(id, { seoKeywordsRu: e.target.value })}
                    />
                  </label>

                  <div className="admin-divider" />
                  <div style={{ fontWeight: 600 }}>SEO (UZ)</div>
                  <label className="admin-field">
                    Meta title (UZ)
                    <input
                      className="admin-input"
                      placeholder="Meta title (UZ)"
                      value={tr.seoTitleUz || ""}
                      onChange={(e) => updateTr(id, { seoTitleUz: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Meta description (UZ)
                    <textarea
                      className="admin-textarea"
                      placeholder="Meta description (UZ)"
                      value={tr.seoDescUz || ""}
                      onChange={(e) => updateTr(id, { seoDescUz: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Meta keywords (UZ)
                    <input
                      className="admin-input"
                      placeholder="kalit1, kalit2, kalit3"
                      value={tr.seoKeywordsUz || ""}
                      onChange={(e) => updateTr(id, { seoKeywordsUz: e.target.value })}
                    />
                  </label>

                  <button
                    className="admin-button"
                    style={{ width: "100%" }}
                    disabled={savingId === id}
                    onClick={() => save(id)}
                  >
                    {savingId === id ? "..." : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
