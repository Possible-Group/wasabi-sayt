"use client";

import { useEffect, useMemo, useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

type NewsRow = {
  id: number;
  slug: string;
  imageUrl: string;
  titleRu: string;
  titleUz: string;
  excerptRu: string;
  excerptUz: string;
  bodyRu: string;
  bodyUz: string;
  seoTitleRu?: string | null;
  seoDescriptionRu?: string | null;
  seoKeywordsRu?: string | null;
  seoTitleUz?: string | null;
  seoDescriptionUz?: string | null;
  seoKeywordsUz?: string | null;
  publishedAt?: string | null;
  active: boolean;
  createdAt?: string;
};

type NewsDraft = Omit<NewsRow, "id" | "createdAt">;

const EMPTY_DRAFT: NewsDraft = {
  slug: "",
  imageUrl: "",
  titleRu: "",
  titleUz: "",
  excerptRu: "",
  excerptUz: "",
  bodyRu: "",
  bodyUz: "",
  seoTitleRu: "",
  seoDescriptionRu: "",
  seoKeywordsRu: "",
  seoTitleUz: "",
  seoDescriptionUz: "",
  seoKeywordsUz: "",
  publishedAt: "",
  active: true,
};

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsRow[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState<NewsDraft>(EMPTY_DRAFT);

  useEffect(() => {
    fetch("/api/admin/news")
      .then((r) => r.json())
      .then((rows: NewsRow[]) => {
        const normalized = Array.isArray(rows)
          ? rows.map((row) => ({
              ...row,
              publishedAt: formatDateInput(row.publishedAt),
            }))
          : [];
        setItems(normalized);
      });
  }, []);

  const sorted = useMemo(
    () =>
      items.slice().sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        if (aDate !== bDate) return bDate - aDate;
        return b.id - a.id;
      }),
    [items]
  );

  function updateItem(id: number, patch: Partial<NewsRow>) {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveItem(item: NewsRow) {
    setSavingId(item.id);
    try {
      const r = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          slug: normalizeSlug(item.slug),
          imageUrl: item.imageUrl,
          titleRu: item.titleRu,
          titleUz: item.titleUz,
          excerptRu: item.excerptRu,
          excerptUz: item.excerptUz,
          bodyRu: item.bodyRu,
          bodyUz: item.bodyUz,
          seoTitleRu: item.seoTitleRu || "",
          seoDescriptionRu: item.seoDescriptionRu || "",
          seoKeywordsRu: item.seoKeywordsRu || "",
          seoTitleUz: item.seoTitleUz || "",
          seoDescriptionUz: item.seoDescriptionUz || "",
          seoKeywordsUz: item.seoKeywordsUz || "",
          publishedAt: item.publishedAt || "",
          active: item.active,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const message =
          data?.error === "SLUG_TAKEN"
            ? "Слаг уже используется"
            : data?.error === "INVALID_SLUG"
              ? "Некорректный слаг"
              : data?.error || "Ошибка сохранения";
        emitAdminToast(message, "error");
        return;
      }
      if (data?.row) {
        const normalized = {
          ...data.row,
          publishedAt: formatDateInput(data.row.publishedAt),
        };
        setItems((prev) => prev.map((row) => (row.id === item.id ? normalized : row)));
      }
      emitAdminToast("Новость сохранена");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteItem(id: number) {
    try {
      const r = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка удаления", "error");
        return;
      }
      setItems((prev) => prev.filter((row) => row.id !== id));
      emitAdminToast("Новость удалена");
    } catch (error) {
      emitAdminToast("Ошибка удаления", "error");
    }
  }

  async function createItem() {
    if (!newItem.slug || !newItem.titleRu || !newItem.titleUz) return;
    try {
      const r = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: normalizeSlug(newItem.slug),
          imageUrl: newItem.imageUrl,
          titleRu: newItem.titleRu,
          titleUz: newItem.titleUz,
          excerptRu: newItem.excerptRu,
          excerptUz: newItem.excerptUz,
          bodyRu: newItem.bodyRu,
          bodyUz: newItem.bodyUz,
          seoTitleRu: newItem.seoTitleRu || "",
          seoDescriptionRu: newItem.seoDescriptionRu || "",
          seoKeywordsRu: newItem.seoKeywordsRu || "",
          seoTitleUz: newItem.seoTitleUz || "",
          seoDescriptionUz: newItem.seoDescriptionUz || "",
          seoKeywordsUz: newItem.seoKeywordsUz || "",
          publishedAt: newItem.publishedAt || "",
          active: newItem.active,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const message =
          data?.error === "SLUG_TAKEN"
            ? "Слаг уже используется"
            : data?.error === "INVALID_SLUG"
              ? "Некорректный слаг"
              : data?.error || "Ошибка сохранения";
        emitAdminToast(message, "error");
        return;
      }
      if (data?.row) {
        setItems((prev) => [...prev, { ...data.row, publishedAt: formatDateInput(data.row.publishedAt) }]);
        setNewItem(EMPTY_DRAFT);
        setUploadFile(null);
      }
      emitAdminToast("Новость добавлена");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    }
  }

  async function uploadPhoto() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const r = await fetch("/api/admin/news/upload", { method: "POST", body: formData });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка загрузки", "error");
        return;
      }
      if (data?.url) {
        setNewItem((prev) => ({ ...prev, imageUrl: data.url }));
      }
      emitAdminToast("Фото загружено");
    } catch (error) {
      emitAdminToast("Ошибка загрузки", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Новости</h1>
        <p className="admin-subtitle">Добавляйте новости на двух языках и SEO для карточек.</p>
      </div>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Новая новость</div>
        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <label className="admin-field">
              Слаг (URL)
              <input
                className="admin-input"
                value={newItem.slug}
                onChange={(e) => setNewItem((p) => ({ ...p, slug: e.target.value }))}
                placeholder="новость-1"
              />
            </label>
            <label className="admin-field">
              Изображение (URL)
              <input
                className="admin-input"
                value={newItem.imageUrl}
                onChange={(e) => setNewItem((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="/uploads/news/..."
              />
            </label>
            <div className="admin-thumb" style={{ width: "100%", height: 160 }}>
              {newItem.imageUrl ? (
                <img src={newItem.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="admin-thumb__empty">Нет фото</div>
              )}
            </div>
            <label className="admin-field">
              Загрузка изображения
              <input
                className="admin-input"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button className="admin-button" disabled={uploading || !uploadFile} onClick={uploadPhoto}>
              {uploading ? "Загрузка..." : "Загрузить фото"}
            </button>
            <label className="admin-field">
              Дата публикации
              <input
                className="admin-input"
                type="date"
                value={newItem.publishedAt || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, publishedAt: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span className="admin-inline" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={newItem.active}
                  onChange={(e) => setNewItem((p) => ({ ...p, active: e.target.checked }))}
                />
                Активна
              </span>
            </label>
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Русский</div>
            <label className="admin-field">
              Заголовок
              <input
                className="admin-input"
                value={newItem.titleRu}
                onChange={(e) => setNewItem((p) => ({ ...p, titleRu: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              Короткое описание
              <textarea
                className="admin-textarea"
                rows={3}
                value={newItem.excerptRu}
                onChange={(e) => setNewItem((p) => ({ ...p, excerptRu: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              Полный текст
              <textarea
                className="admin-textarea"
                rows={6}
                value={newItem.bodyRu}
                onChange={(e) => setNewItem((p) => ({ ...p, bodyRu: e.target.value }))}
              />
            </label>
            <div className="admin-divider" />
            <label className="admin-field">
              SEO title
              <input
                className="admin-input"
                value={newItem.seoTitleRu || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, seoTitleRu: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              SEO description
              <textarea
                className="admin-textarea"
                rows={2}
                value={newItem.seoDescriptionRu || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, seoDescriptionRu: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              SEO keywords
              <input
                className="admin-input"
                value={newItem.seoKeywordsRu || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, seoKeywordsRu: e.target.value }))}
              />
            </label>
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>O'zbekcha</div>
            <label className="admin-field">
              Sarlavha
              <input
                className="admin-input"
                value={newItem.titleUz}
                onChange={(e) => setNewItem((p) => ({ ...p, titleUz: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              Qisqa tavsif
              <textarea
                className="admin-textarea"
                rows={3}
                value={newItem.excerptUz}
                onChange={(e) => setNewItem((p) => ({ ...p, excerptUz: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              To'liq matn
              <textarea
                className="admin-textarea"
                rows={6}
                value={newItem.bodyUz}
                onChange={(e) => setNewItem((p) => ({ ...p, bodyUz: e.target.value }))}
              />
            </label>
            <div className="admin-divider" />
            <label className="admin-field">
              SEO title
              <input
                className="admin-input"
                value={newItem.seoTitleUz || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, seoTitleUz: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              SEO description
              <textarea
                className="admin-textarea"
                rows={2}
                value={newItem.seoDescriptionUz || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, seoDescriptionUz: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              SEO keywords
              <input
                className="admin-input"
                value={newItem.seoKeywordsUz || ""}
                onChange={(e) => setNewItem((p) => ({ ...p, seoKeywordsUz: e.target.value }))}
              />
            </label>
          </div>
        </div>
        <button
          className="admin-button"
          disabled={
            !newItem.slug ||
            !newItem.imageUrl ||
            !newItem.titleRu ||
            !newItem.titleUz ||
            !newItem.excerptRu ||
            !newItem.excerptUz ||
            !newItem.bodyRu ||
            !newItem.bodyUz
          }
          onClick={createItem}
        >
          Добавить новость
        </button>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Список новостей</div>
        {sorted.length === 0 ? (
          <div className="admin-subtitle">Пока нет ни одной новости.</div>
        ) : (
          <div className="stack">
            {sorted.map((item) => (
              <div key={item.id} className="admin-card stack" style={{ boxShadow: "none" }}>
                <div className="admin-inline">
                  <div className="admin-subtitle">ID: {item.id}</div>
                  <div className="admin-pill">{item.active ? "Активна" : "Скрыта"}</div>
                  <div className="admin-subtitle">{item.slug}</div>
                </div>
                <div className="admin-grid">
                  <div className="admin-card stack" style={{ boxShadow: "none" }}>
                    <label className="admin-field">
                      Слаг (URL)
                      <input
                        className="admin-input"
                        value={item.slug}
                        onChange={(e) => updateItem(item.id, { slug: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      Изображение (URL)
                      <input
                        className="admin-input"
                        value={item.imageUrl}
                        onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                      />
                    </label>
                    <div className="admin-thumb" style={{ width: "100%", height: 140 }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div className="admin-thumb__empty">Нет фото</div>
                      )}
                    </div>
                    <label className="admin-field">
                      Дата публикации
                      <input
                        className="admin-input"
                        type="date"
                        value={item.publishedAt || ""}
                        onChange={(e) => updateItem(item.id, { publishedAt: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      <span className="admin-inline" style={{ gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={(e) => updateItem(item.id, { active: e.target.checked })}
                        />
                        Активна
                      </span>
                    </label>
                  </div>

                  <div className="admin-card stack" style={{ boxShadow: "none" }}>
                    <div style={{ fontWeight: 600 }}>RU</div>
                    <label className="admin-field">
                      Заголовок
                      <input
                        className="admin-input"
                        value={item.titleRu}
                        onChange={(e) => updateItem(item.id, { titleRu: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      Описание
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        value={item.excerptRu}
                        onChange={(e) => updateItem(item.id, { excerptRu: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      Полный текст
                      <textarea
                        className="admin-textarea"
                        rows={6}
                        value={item.bodyRu}
                        onChange={(e) => updateItem(item.id, { bodyRu: e.target.value })}
                      />
                    </label>
                    <div className="admin-divider" />
                    <label className="admin-field">
                      SEO title
                      <input
                        className="admin-input"
                        value={item.seoTitleRu || ""}
                        onChange={(e) => updateItem(item.id, { seoTitleRu: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      SEO description
                      <textarea
                        className="admin-textarea"
                        rows={2}
                        value={item.seoDescriptionRu || ""}
                        onChange={(e) => updateItem(item.id, { seoDescriptionRu: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      SEO keywords
                      <input
                        className="admin-input"
                        value={item.seoKeywordsRu || ""}
                        onChange={(e) => updateItem(item.id, { seoKeywordsRu: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="admin-card stack" style={{ boxShadow: "none" }}>
                    <div style={{ fontWeight: 600 }}>UZ</div>
                    <label className="admin-field">
                      Sarlavha
                      <input
                        className="admin-input"
                        value={item.titleUz}
                        onChange={(e) => updateItem(item.id, { titleUz: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      Tavsif
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        value={item.excerptUz}
                        onChange={(e) => updateItem(item.id, { excerptUz: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      To'liq matn
                      <textarea
                        className="admin-textarea"
                        rows={6}
                        value={item.bodyUz}
                        onChange={(e) => updateItem(item.id, { bodyUz: e.target.value })}
                      />
                    </label>
                    <div className="admin-divider" />
                    <label className="admin-field">
                      SEO title
                      <input
                        className="admin-input"
                        value={item.seoTitleUz || ""}
                        onChange={(e) => updateItem(item.id, { seoTitleUz: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      SEO description
                      <textarea
                        className="admin-textarea"
                        rows={2}
                        value={item.seoDescriptionUz || ""}
                        onChange={(e) => updateItem(item.id, { seoDescriptionUz: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      SEO keywords
                      <input
                        className="admin-input"
                        value={item.seoKeywordsUz || ""}
                        onChange={(e) => updateItem(item.id, { seoKeywordsUz: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                <div className="admin-inline">
                  <button className="admin-button" disabled={savingId === item.id} onClick={() => saveItem(item)}>
                    {savingId === item.id ? "Сохраняю..." : "Сохранить"}
                  </button>
                  <button className="admin-button admin-button-muted" onClick={() => deleteItem(item.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
