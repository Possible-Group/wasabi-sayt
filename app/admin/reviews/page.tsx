"use client";

import { useEffect, useMemo, useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

type ReviewRow = {
  id: number;
  authorName: string;
  authorRole?: string | null;
  titleRu?: string | null;
  titleUz?: string | null;
  textRu?: string | null;
  textUz?: string | null;
  rating: number;
  photoUrl?: string | null;
  publishedAt?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
};

type ReviewDraft = {
  authorName: string;
  authorRole: string;
  titleRu: string;
  titleUz: string;
  textRu: string;
  textUz: string;
  rating: number;
  photoUrl: string;
  publishedAt: string;
  sortOrder: number;
  active: boolean;
};

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeRating(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 1;
  return Math.min(5, Math.max(1, Math.round(num)));
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newReview, setNewReview] = useState<ReviewDraft>({
    authorName: "",
    authorRole: "",
    titleRu: "",
    titleUz: "",
    textRu: "",
    textUz: "",
    rating: 5,
    photoUrl: "",
    publishedAt: "",
    sortOrder: 0,
    active: true,
  });

  useEffect(() => {
    fetch("/api/admin/reviews").then((r) => r.json()).then(setReviews);
  }, []);

  const sorted = useMemo(
    () => reviews.slice().sort((a, b) => a.sortOrder - b.sortOrder || b.id - a.id),
    [reviews]
  );

  function updateReview(id: number, patch: Partial<ReviewRow>) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveReview(review: ReviewRow) {
    setSavingId(review.id);
    try {
      const r = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: review.id,
          authorName: review.authorName,
          authorRole: review.authorRole || "",
          titleRu: review.titleRu || "",
          titleUz: review.titleUz || "",
          textRu: review.textRu || "",
          textUz: review.textUz || "",
          rating: normalizeRating(review.rating ?? 5),
          photoUrl: review.photoUrl || "",
          publishedAt: review.publishedAt || "",
          sortOrder: Number.isFinite(review.sortOrder) ? review.sortOrder : 0,
          active: review.active,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setReviews((prev) => prev.map((item) => (item.id === review.id ? data.row : item)));
      }
      emitAdminToast("Отзыв сохранен");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteReview(id: number) {
    try {
      const r = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка удаления", "error");
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
      emitAdminToast("Отзыв удален");
    } catch (error) {
      emitAdminToast("Ошибка удаления", "error");
    }
  }

  async function createReview() {
    if (!newReview.authorName) return;
    try {
      const r = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          authorName: newReview.authorName,
          authorRole: newReview.authorRole || "",
          titleRu: newReview.titleRu || "",
          titleUz: newReview.titleUz || "",
          textRu: newReview.textRu || "",
          textUz: newReview.textUz || "",
          rating: normalizeRating(newReview.rating ?? 5),
          photoUrl: newReview.photoUrl || "",
          publishedAt: newReview.publishedAt || "",
          sortOrder: Number.isFinite(newReview.sortOrder) ? newReview.sortOrder : 0,
          active: newReview.active,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setReviews((prev) => [...prev, data.row]);
        setNewReview({
          authorName: "",
          authorRole: "",
          titleRu: "",
          titleUz: "",
          textRu: "",
          textUz: "",
          rating: 5,
          photoUrl: "",
          publishedAt: "",
          sortOrder: 0,
          active: true,
        });
        setUploadFile(null);
      }
      emitAdminToast("Отзыв добавлен");
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
      const r = await fetch("/api/admin/reviews/upload", { method: "POST", body: formData });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка загрузки", "error");
        return;
      }
      if (data?.url) {
        setNewReview((prev) => ({ ...prev, photoUrl: data.url }));
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
        <h1 className="admin-title">Отзывы</h1>
        <p className="admin-subtitle">Добавляйте отзывы для отображения на сайте.</p>
      </div>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Новый отзыв</div>
        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <label className="admin-field">
              Имя
              <input
                className="admin-input"
                value={newReview.authorName}
                onChange={(e) => setNewReview((p) => ({ ...p, authorName: e.target.value }))}
                placeholder="Имя клиента"
              />
            </label>
            <label className="admin-field">
              Роль/город (опционально)
              <input
                className="admin-input"
                value={newReview.authorRole}
                onChange={(e) => setNewReview((p) => ({ ...p, authorRole: e.target.value }))}
                placeholder="Ташкент"
              />
            </label>
            <label className="admin-field">
              Рейтинг (1-5)
              <input
                className="admin-input"
                type="number"
                min={1}
                max={5}
                value={newReview.rating}
                onChange={(e) => setNewReview((p) => ({ ...p, rating: normalizeRating(e.target.value) }))}
              />
            </label>
            <label className="admin-field">
              Дата
              <input
                className="admin-input"
                type="date"
                value={newReview.publishedAt}
                onChange={(e) => setNewReview((p) => ({ ...p, publishedAt: e.target.value }))}
              />
            </label>
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <label className="admin-field">
              Фото (URL)
              <input
                className="admin-input"
                value={newReview.photoUrl}
                onChange={(e) => setNewReview((p) => ({ ...p, photoUrl: e.target.value }))}
                placeholder="/uploads/reviews/..."
              />
            </label>
            <div className="admin-thumb" style={{ width: 120, height: 120 }}>
              {newReview.photoUrl ? (
                <img src={newReview.photoUrl} alt="review" loading="lazy" />
              ) : (
                <div className="admin-thumb__empty">Нет фото</div>
              )}
            </div>
            <label className="admin-field">
              Или загрузить файл
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </label>
            <button className="admin-button" disabled={uploading || !uploadFile} onClick={uploadPhoto}>
              {uploading ? "..." : "Загрузить"}
            </button>
            <label className="admin-field">
              Порядок
              <input
                className="admin-input"
                type="number"
                value={newReview.sortOrder}
                onChange={(e) => setNewReview((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
              />
            </label>
            <label
              className="admin-field"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <span>Активен</span>
              <input
                type="checkbox"
                checked={newReview.active}
                onChange={(e) => setNewReview((p) => ({ ...p, active: e.target.checked }))}
              />
            </label>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>RU</div>
            <label className="admin-field">
              Заголовок
              <input
                className="admin-input"
                value={newReview.titleRu}
                onChange={(e) => setNewReview((p) => ({ ...p, titleRu: e.target.value }))}
                placeholder="Лучшие роллы"
              />
            </label>
            <label className="admin-field">
              Текст
              <textarea
                className="admin-textarea"
                value={newReview.textRu}
                onChange={(e) => setNewReview((p) => ({ ...p, textRu: e.target.value }))}
              />
            </label>
          </div>
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>UZ</div>
            <label className="admin-field">
              Sarlavha
              <input
                className="admin-input"
                value={newReview.titleUz}
                onChange={(e) => setNewReview((p) => ({ ...p, titleUz: e.target.value }))}
                placeholder="Eng yaxshi rollar"
              />
            </label>
            <label className="admin-field">
              Matn
              <textarea
                className="admin-textarea"
                value={newReview.textUz}
                onChange={(e) => setNewReview((p) => ({ ...p, textUz: e.target.value }))}
              />
            </label>
          </div>
        </div>

        <button className="admin-button" disabled={!newReview.authorName} onClick={createReview}>
          Добавить отзыв
        </button>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Список отзывов</div>
        <div className="stack">
          {sorted.map((review) => (
            <div key={review.id} className="admin-card stack" style={{ boxShadow: "none" }}>
              <div className="admin-inline">
                <div className="admin-subtitle">ID: {review.id}</div>
                <div className="admin-pill">{review.active ? "Активен" : "Скрыт"}</div>
              </div>
              <div className="admin-grid">
                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <label className="admin-field">
                    Имя
                    <input
                      className="admin-input"
                      value={review.authorName}
                      onChange={(e) => updateReview(review.id, { authorName: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Роль/город
                    <input
                      className="admin-input"
                      value={review.authorRole || ""}
                      onChange={(e) => updateReview(review.id, { authorRole: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Рейтинг
                    <input
                      className="admin-input"
                    type="number"
                    min={1}
                    max={5}
                    value={review.rating}
                    onChange={(e) => updateReview(review.id, { rating: normalizeRating(e.target.value) })}
                  />
                  </label>
                  <label className="admin-field">
                    Дата
                    <input
                      className="admin-input"
                      type="date"
                      value={formatDateInput(review.publishedAt || review.createdAt)}
                      onChange={(e) => updateReview(review.id, { publishedAt: e.target.value })}
                    />
                  </label>
                </div>

                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div className="admin-thumb" style={{ width: 120, height: 120 }}>
                    {review.photoUrl ? (
                      <img src={review.photoUrl} alt="review" loading="lazy" />
                    ) : (
                      <div className="admin-thumb__empty">Нет фото</div>
                    )}
                  </div>
                  <label className="admin-field">
                    Фото (URL)
                    <input
                      className="admin-input"
                      value={review.photoUrl || ""}
                      onChange={(e) => updateReview(review.id, { photoUrl: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Порядок
                    <input
                      className="admin-input"
                      type="number"
                      value={review.sortOrder}
                      onChange={(e) => updateReview(review.id, { sortOrder: Number(e.target.value) })}
                    />
                  </label>
                  <label
                    className="admin-field"
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <span>Активен</span>
                    <input
                      type="checkbox"
                      checked={review.active}
                      onChange={(e) => updateReview(review.id, { active: e.target.checked })}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-grid">
                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 600 }}>RU</div>
                  <label className="admin-field">
                    Заголовок
                    <input
                      className="admin-input"
                      value={review.titleRu || ""}
                      onChange={(e) => updateReview(review.id, { titleRu: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Текст
                    <textarea
                      className="admin-textarea"
                      value={review.textRu || ""}
                      onChange={(e) => updateReview(review.id, { textRu: e.target.value })}
                    />
                  </label>
                </div>
                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 600 }}>UZ</div>
                  <label className="admin-field">
                    Sarlavha
                    <input
                      className="admin-input"
                      value={review.titleUz || ""}
                      onChange={(e) => updateReview(review.id, { titleUz: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Matn
                    <textarea
                      className="admin-textarea"
                      value={review.textUz || ""}
                      onChange={(e) => updateReview(review.id, { textUz: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="admin-inline">
                <button
                  className="admin-button"
                  disabled={savingId === review.id}
                  onClick={() => saveReview(review)}
                >
                  {savingId === review.id ? "..." : "Сохранить"}
                </button>
                <button className="admin-button admin-button-muted" onClick={() => deleteReview(review.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
