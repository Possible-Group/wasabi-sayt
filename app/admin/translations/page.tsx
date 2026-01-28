"use client";

import { useEffect, useMemo, useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

type PosterProduct = {
  product_id?: string | null;
  product_name?: string | null;
  ingredients?: string | null;
  description?: string | null;
  photo?: string | null;
  photo_origin?: string | null;
  photo_raw?: string | null;
  category_id?: string | null;
};

type PosterCategory = {
  category_id?: string | null;
  category_name?: string | null;
  name?: string | null;
};

type TrRow = {
  productId: string;
  nameUz?: string | null;
  descUz?: string | null;
  sortOrder?: number | null;
  seoTitleRu?: string | null;
  seoDescRu?: string | null;
  seoKeywordsRu?: string | null;
  seoTitleUz?: string | null;
  seoDescUz?: string | null;
  seoKeywordsUz?: string | null;
  hidden?: boolean | null;
};

type PageItem = number | "ellipsis";

const PAGE_SIZE = 80;

function normalizeText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function buildPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const items: PageItem[] = [1];
  if (page > 3) items.push("ellipsis");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i += 1) items.push(i);
  if (page < totalPages - 2) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (next: number) => void;
}) {
  if (totalPages <= 1) return null;
  const items = buildPageItems(page, totalPages);

  return (
    <div className="admin-pagination">
      <button
        className="admin-page-btn"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Назад
      </button>
      {items.map((item, idx) => {
        if (item === "ellipsis") {
          return (
            <span key={`ellipsis-${idx}`} className="admin-page-ellipsis">
              ...
            </span>
          );
        }
        return (
          <button
            key={item}
            className={`admin-page-btn${item === page ? " active" : ""}`}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        );
      })}
      <button
        className="admin-page-btn"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Вперед
      </button>
    </div>
  );
}

export default function AdminTranslationsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<PosterProduct[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [trs, setTrs] = useState<Record<string, TrRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/poster/products?include_hidden=1").then((r) => r.json()).then(setProducts);
    fetch("/api/poster/categories?include_hidden=1")
      .then((r) => r.json())
      .then((rows: PosterCategory[]) => {
        const map: Record<string, string> = {};
        rows.forEach((c) => {
          const id = normalizeText(c.category_id ?? "");
          const name = normalizeText(c.category_name ?? c.name ?? "");
          if (id) map[id] = name || id;
        });
        setCategoryMap(map);
      });
    fetch("/api/admin/product-translations")
      .then((r) => r.json())
      .then((rows: TrRow[]) => {
        const map: Record<string, TrRow> = {};
        rows.forEach((x) => (map[x.productId] = x));
        setTrs(map);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return products;
    return products.filter((p) =>
      normalizeText(p.product_name ?? "").toLowerCase().includes(qq)
    );
  }, [products, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function updateTr(productId: string, patch: Partial<TrRow>) {
    setTrs((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || { productId }), ...patch },
    }));
  }

  async function save(productId: string) {
    setSavingId(productId);
    try {
      const row = trs[productId] || { productId };
      const r = await fetch("/api/admin/product-translations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          nameUz: row.nameUz || "",
          descUz: row.descUz || "",
          sortOrder: row.sortOrder ?? null,
          seoTitleRu: row.seoTitleRu || "",
          seoDescRu: row.seoDescRu || "",
          seoKeywordsRu: row.seoKeywordsRu || "",
          seoTitleUz: row.seoTitleUz || "",
          seoDescUz: row.seoDescUz || "",
          seoKeywordsUz: row.seoKeywordsUz || "",
          hidden: row.hidden ?? false,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setTrs((p) => ({ ...p, [productId]: data.row }));
      }
      emitAdminToast("Перевод сохранен");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Переводы RU - UZ</h1>
        <p className="admin-subtitle">
          Русские данные берутся из Poster. Заполняйте переводы и SEO для RU и UZ.
        </p>
      </div>

      <div className="admin-inline">
        <input
          className="admin-input"
          placeholder="Поиск товара (RU)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <div className="admin-pill">Всего: {filtered.length}</div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      <div className="stack">
        {pageProducts.map((p: PosterProduct) => {
          const id = String(p.product_id ?? "");
          const nameRu = normalizeText(p.product_name ?? "");
          const descRu = normalizeText(p.ingredients ?? p.description ?? "");
          const categoryName = p.category_id ? categoryMap[p.category_id] : "";
          const photo = p.photo_origin || p.photo || p.photo_raw || "";

          const tr = trs[id] || { productId: id };

          return (
            <div key={id} className="admin-card stack">
              <div className="admin-inline">
                <div className="admin-subtitle">ID: {id}</div>
                {categoryName && <div className="admin-pill">{categoryName}</div>}
                <label className="admin-inline" style={{ marginLeft: "auto", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(tr.hidden)}
                    onChange={(e) => updateTr(id, { hidden: e.target.checked })}
                  />
                  <span className="admin-subtitle">Скрыть на сайте</span>
                </label>
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
                    <div className="stack" style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{nameRu || "Без названия"}</div>
                      <div className="admin-subtitle">
                        Категория: {categoryName || p.category_id || "-"}
                      </div>
                      <div className="admin-subtitle" style={{ whiteSpace: "pre-wrap" }}>
                        {descRu || "Описание отсутствует"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 600 }}>UZ (заполняем)</div>
                  <label className="admin-field">
                    Порядок в категории
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="Например, 10"
                      value={tr.sortOrder ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const sortOrder = raw === "" ? null : Number(raw);
                        updateTr(id, { sortOrder: Number.isFinite(sortOrder) ? sortOrder : null });
                      }}
                    />
                  </label>
                  <div className="admin-subtitle">Меньше — выше в списке.</div>
                  <label className="admin-field">
                    Название (UZ)
                    <input
                      className="admin-input"
                      placeholder="Название (UZ)"
                      value={tr.nameUz || ""}
                      onChange={(e) => updateTr(id, { nameUz: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Описание (UZ)
                    <textarea
                      className="admin-textarea"
                      placeholder="Описание (UZ)"
                      value={tr.descUz || ""}
                      onChange={(e) => updateTr(id, { descUz: e.target.value })}
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

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      <div className="admin-subtitle">
        Пагинация по {PAGE_SIZE} товаров на страницу.
      </div>
    </div>
  );
}
