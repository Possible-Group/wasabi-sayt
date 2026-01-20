"use client";

import { useEffect, useMemo, useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

type Banner = {
  id: number;
  imageUrl: string;
  href?: string | null;
  locale?: "ru" | "uz" | "all" | null;
  sortOrder: number;
  active: boolean;
};

type PosterProduct = {
  product_id?: string | null;
  product_name?: string | null;
  category_name?: string | null;
  category_id?: string | null;
  menu_category_id?: string | null;
  photo?: string | null;
  photo_origin?: string | null;
  image?: string | null;
};

type PosterSpot = {
  spot_id: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type AboutLocation = {
  id: string;
  spotId?: string | null;
  nameRu?: string | null;
  nameUz?: string | null;
  addressRu?: string | null;
  addressUz?: string | null;
  descRu?: string | null;
  descUz?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type AboutStat = {
  id: string;
  value: string;
  labelRu?: string | null;
  labelUz?: string | null;
};

type AboutStats = {
  badgeRu: string;
  badgeUz: string;
  stats: AboutStat[];
};

type ContentPage = {
  id?: number;
  slug: string;
  locale: "ru" | "uz";
  title?: string | null;
  body?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
};

const CONTENT_SECTIONS = [
  { slug: "about", title: "О нас" },
  { slug: "contacts", title: "Контакты и адрес" },
  { slug: "vacancies", title: "Вакансии" },
  { slug: "delivery", title: "Доставка и оплата" },
  { slug: "promotions", title: "Акции" },
] as const;

const DEFAULT_ABOUT_STATS: AboutStats = {
  badgeRu: "С заботой о вкусе",
  badgeUz: "Muhabbat bilan tayyorlanadi",
  stats: [
    { id: "exp", value: "15+", labelRu: "Лет опыта", labelUz: "Yil tajriba" },
    { id: "menu", value: "80+", labelRu: "Позиции в меню", labelUz: "Taomlar menyuda" },
    { id: "loc", value: "3", labelRu: "Локации", labelUz: "Lokatsiya" },
  ],
};

function contentKey(slug: string, locale: string) {
  return `${slug}:${locale}`;
}

function normalizeText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatsPayload(payload: any): AboutStats {
  const badgeRu =
    typeof payload?.badgeRu === "string" && payload.badgeRu.trim()
      ? payload.badgeRu
      : DEFAULT_ABOUT_STATS.badgeRu;
  const badgeUz =
    typeof payload?.badgeUz === "string" && payload.badgeUz.trim()
      ? payload.badgeUz
      : DEFAULT_ABOUT_STATS.badgeUz;
  const incoming = Array.isArray(payload?.stats) ? payload.stats : [];
  const stats: AboutStat[] = [];
  for (let i = 0; i < DEFAULT_ABOUT_STATS.stats.length; i += 1) {
    const fallback = DEFAULT_ABOUT_STATS.stats[i];
    const item = incoming[i] || {};
    stats.push({
      id: String(item?.id ?? fallback.id),
      value: String(item?.value ?? fallback.value),
      labelRu: item?.labelRu ?? fallback.labelRu ?? "",
      labelUz: item?.labelUz ?? fallback.labelUz ?? "",
    });
  }
  return { badgeRu, badgeUz, stats };
}

export default function AdminContentPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBanner, setNewBanner] = useState({
    imageUrl: "",
    href: "",
    locale: "all" as "ru" | "uz" | "all",
    sortOrder: 0,
    active: true,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState<Record<string, ContentPage>>({});
  const [savingContentKey, setSavingContentKey] = useState<string | null>(null);
  const [savingBannerId, setSavingBannerId] = useState<number | null>(null);
  const [popularIds, setPopularIds] = useState<string[]>([]);
  const [popularSaving, setPopularSaving] = useState(false);
  const [popularQuery, setPopularQuery] = useState("");
  const [products, setProducts] = useState<PosterProduct[]>([]);
  const [spots, setSpots] = useState<PosterSpot[]>([]);
  const [locations, setLocations] = useState<AboutLocation[]>([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationsSaving, setLocationsSaving] = useState(false);
  const [aboutStats, setAboutStats] = useState<AboutStats>(DEFAULT_ABOUT_STATS);
  const [aboutStatsSaving, setAboutStatsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/banners").then((r) => r.json()).then(setBanners);
    fetch("/api/admin/popular-products")
      .then((r) => r.json())
      .then((data) => setPopularIds(Array.isArray(data?.ids) ? data.ids : []));
    fetch("/api/poster/products?include_hidden=1")
      .then((r) => r.json())
      .then((rows) => setProducts(Array.isArray(rows) ? rows : []));
    fetch("/api/poster/spots")
      .then((r) => r.json())
      .then((rows) => setSpots(Array.isArray(rows) ? rows : []));
    fetch("/api/admin/about-locations")
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data?.locations) ? data.locations : []));
    fetch("/api/admin/about-stats")
      .then((r) => r.json())
      .then((data) => setAboutStats(normalizeStatsPayload(data)));
    fetch("/api/admin/content-pages")
      .then((r) => r.json())
      .then((rows: ContentPage[]) => {
        const map: Record<string, ContentPage> = {};
        rows.forEach((row) => {
          map[contentKey(row.slug, row.locale)] = row;
        });
        setContent(map);
      });
  }, []);

  const bannerRows = useMemo(
    () => banners.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [banners]
  );

  const productMap = useMemo(() => {
    const map = new Map<string, PosterProduct>();
    products.forEach((p) => {
      const id = normalizeText(p.product_id ?? "");
      if (id) map.set(id, p);
    });
    return map;
  }, [products]);

  const selectedProducts = useMemo(
    () => popularIds.map((id) => productMap.get(id)).filter(Boolean) as PosterProduct[],
    [popularIds, productMap]
  );

  const filteredProducts = useMemo(() => {
    const qq = popularQuery.trim().toLowerCase();
    let list = products;
    if (qq) {
      list = list.filter((p) => {
        const name = normalizeText(p.product_name ?? "").toLowerCase();
        const cat = normalizeText(p.category_name ?? "").toLowerCase();
        return name.includes(qq) || cat.includes(qq);
      });
    }
    const selected = new Set(popularIds);
    return list.filter((p) => !selected.has(normalizeText(p.product_id ?? "")));
  }, [products, popularQuery, popularIds]);

  function addPopular(id: string) {
    if (!id) return;
    setPopularIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removePopular(id: string) {
    setPopularIds((prev) => prev.filter((x) => x !== id));
  }

  function movePopular(id: string, dir: number) {
    setPopularIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  }

  async function savePopular() {
    setPopularSaving(true);
    try {
      const r = await fetch("/api/admin/popular-products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: popularIds }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (Array.isArray(data?.ids)) setPopularIds(data.ids);
      emitAdminToast("Популярные товары сохранены");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setPopularSaving(false);
    }
  }

  function addLocationFromSpot(spot: PosterSpot) {
    if (locations.length >= 3) return;
    if (locations.some((l) => l.spotId === spot.spot_id)) return;
    setLocations((prev) => [
      ...prev,
      {
        id: spot.spot_id,
        spotId: spot.spot_id,
        nameRu: spot.name,
        nameUz: "",
        addressRu: spot.address ?? "",
        addressUz: "",
        descRu: "",
        descUz: "",
        lat: spot.lat ?? null,
        lng: spot.lng ?? null,
      },
    ]);
  }

  function updateLocation(id: string, patch: Partial<AboutLocation>) {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLocation(id: string) {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }

  function moveLocation(id: string, dir: number) {
    setLocations((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  }

  async function saveLocations() {
    setLocationsSaving(true);
    try {
      const r = await fetch("/api/admin/about-locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locations }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (Array.isArray(data?.locations)) setLocations(data.locations);
      emitAdminToast("Локации сохранены");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setLocationsSaving(false);
    }
  }

  function updateAboutStats(patch: Partial<AboutStats>) {
    setAboutStats((prev) => ({ ...prev, ...patch }));
  }

  function updateAboutStat(id: string, patch: Partial<AboutStat>) {
    setAboutStats((prev) => ({
      ...prev,
      stats: prev.stats.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  async function saveAboutStats() {
    setAboutStatsSaving(true);
    try {
      const r = await fetch("/api/admin/about-stats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(aboutStats),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      setAboutStats(normalizeStatsPayload(data));
      emitAdminToast("Статистика сохранена");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setAboutStatsSaving(false);
    }
  }

  const filteredSpots = useMemo(() => {
    const qq = locationQuery.trim().toLowerCase();
    if (!qq) return spots;
    return spots.filter((s) => {
      const name = normalizeText(s.name ?? "").toLowerCase();
      const address = normalizeText(s.address ?? "").toLowerCase();
      return name.includes(qq) || address.includes(qq);
    });
  }, [spots, locationQuery]);

  function updateBanner(id: number, patch: Partial<Banner>) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function saveBanner(banner: Banner) {
    setSavingBannerId(banner.id);
    try {
      const r = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: banner.id,
          imageUrl: banner.imageUrl,
          href: banner.href || "",
          locale: banner.locale || "all",
          sortOrder: Number.isFinite(banner.sortOrder) ? banner.sortOrder : 0,
          active: banner.active,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? data.row : b)));
      }
      emitAdminToast("Баннер сохранен");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSavingBannerId(null);
    }
  }

  async function deleteBanner(id: number) {
    try {
      const r = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка удаления", "error");
        return;
      }
      setBanners((prev) => prev.filter((b) => b.id !== id));
      emitAdminToast("Баннер удален");
    } catch (error) {
      emitAdminToast("Ошибка удаления", "error");
    }
  }

  async function createBanner() {
    if (!newBanner.imageUrl) return;
    try {
      const r = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageUrl: newBanner.imageUrl,
          href: newBanner.href || "",
          locale: newBanner.locale || "all",
          sortOrder: Number.isFinite(newBanner.sortOrder) ? newBanner.sortOrder : 0,
          active: newBanner.active,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setBanners((prev) => [...prev, data.row]);
        setNewBanner({ imageUrl: "", href: "", locale: "all", sortOrder: 0, active: true });
        setUploadFile(null);
      }
      emitAdminToast("Баннер добавлен");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    }
  }

  async function uploadBannerFile() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const r = await fetch("/api/admin/banners/upload", { method: "POST", body: formData });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка загрузки", "error");
        return;
      }
      if (data?.url) {
        setNewBanner((prev) => ({ ...prev, imageUrl: data.url }));
      }
      emitAdminToast("Файл загружен");
    } catch (error) {
      emitAdminToast("Ошибка загрузки", "error");
    } finally {
      setUploading(false);
    }
  }

  function updateContent(slug: string, locale: "ru" | "uz", patch: Partial<ContentPage>) {
    const key = contentKey(slug, locale);
    setContent((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { slug, locale }), ...patch },
    }));
  }

  async function saveContent(slug: string, locale: "ru" | "uz") {
    const key = contentKey(slug, locale);
    const row = content[key] || { slug, locale };
    setSavingContentKey(key);
    try {
      const r = await fetch("/api/admin/content-pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          locale,
          title: row.title || "",
          body: row.body || "",
          seoTitle: row.seoTitle || "",
          seoDescription: row.seoDescription || "",
          seoKeywords: row.seoKeywords || "",
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      if (data?.row) {
        setContent((prev) => ({ ...prev, [key]: data.row }));
      }
      emitAdminToast("Контент сохранен");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSavingContentKey(null);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Контент</h1>
        <p className="admin-subtitle">Баннеры, страницы и SEO для статичных разделов.</p>
      </div>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Баннеры</div>
        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Добавить баннер</div>
            <label className="admin-field">
              Ссылка на изображение
              <input
                className="admin-input"
                placeholder="/uploads/banners/..."
                value={newBanner.imageUrl}
                onChange={(e) => setNewBanner((p) => ({ ...p, imageUrl: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              Или загрузить файл
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </label>
            <button className="admin-button" disabled={uploading || !uploadFile} onClick={uploadBannerFile}>
              {uploading ? "..." : "Загрузить"}
            </button>
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Данные баннера</div>
            <label className="admin-field">
              Ссылка (куда ведет)
              <input
                className="admin-input"
                placeholder="/ru/menu"
                value={newBanner.href}
                onChange={(e) => setNewBanner((p) => ({ ...p, href: e.target.value }))}
              />
            </label>
            <label className="admin-field">
              Язык показа
              <select
                className="admin-input"
                value={newBanner.locale}
                onChange={(e) =>
                  setNewBanner((p) => ({ ...p, locale: e.target.value as "ru" | "uz" | "all" }))
                }
              >
                <option value="all">Все языки</option>
                <option value="ru">Русский</option>
                <option value="uz">Узбекский</option>
              </select>
            </label>
            <label className="admin-field">
              Порядок
              <input
                className="admin-input"
                type="number"
                value={newBanner.sortOrder}
                onChange={(e) => setNewBanner((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
              />
            </label>
            <label
              className="admin-field"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <span>Активен</span>
              <input
                type="checkbox"
                checked={newBanner.active}
                onChange={(e) => setNewBanner((p) => ({ ...p, active: e.target.checked }))}
              />
            </label>
            <button className="admin-button" disabled={!newBanner.imageUrl} onClick={createBanner}>
              Добавить
            </button>
          </div>
        </div>

        <div className="stack">
          {bannerRows.map((banner) => (
            <div key={banner.id} className="admin-card stack" style={{ boxShadow: "none" }}>
              <div className="admin-inline">
                <div className="admin-subtitle">ID: {banner.id}</div>
                <div className="admin-pill">{banner.active ? "Активен" : "Скрыт"}</div>
                <div className="admin-pill">
                  {(banner.locale ?? "all") === "ru"
                    ? "RU"
                    : (banner.locale ?? "all") === "uz"
                    ? "UZ"
                    : "Все языки"}
                </div>
              </div>
              <div className="admin-grid">
                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div className="admin-thumb" style={{ width: 140, height: 90 }}>
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt="banner" loading="lazy" />
                    ) : (
                      <div className="admin-thumb__empty">Нет фото</div>
                    )}
                  </div>
                </div>
                <div className="admin-card stack" style={{ boxShadow: "none" }}>
                  <label className="admin-field">
                    URL изображения
                    <input
                      className="admin-input"
                      value={banner.imageUrl}
                      onChange={(e) => updateBanner(banner.id, { imageUrl: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Ссылка
                    <input
                      className="admin-input"
                      value={banner.href || ""}
                      onChange={(e) => updateBanner(banner.id, { href: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Язык показа
                    <select
                      className="admin-input"
                      value={banner.locale ?? "all"}
                      onChange={(e) =>
                        updateBanner(banner.id, {
                          locale: e.target.value as "ru" | "uz" | "all",
                        })
                      }
                    >
                      <option value="all">Все языки</option>
                      <option value="ru">Русский</option>
                      <option value="uz">Узбекский</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    Порядок
                    <input
                      className="admin-input"
                      type="number"
                      value={banner.sortOrder}
                      onChange={(e) => updateBanner(banner.id, { sortOrder: Number(e.target.value) })}
                    />
                  </label>
                  <label
                    className="admin-field"
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <span>Активен</span>
                    <input
                      type="checkbox"
                      checked={banner.active}
                      onChange={(e) => updateBanner(banner.id, { active: e.target.checked })}
                    />
                  </label>
                  <div className="admin-inline">
                    <button
                      className="admin-button"
                      disabled={savingBannerId === banner.id}
                      onClick={() => saveBanner(banner)}
                    >
                      {savingBannerId === banner.id ? "..." : "Сохранить"}
                    </button>
                    <button className="admin-button admin-button-muted" onClick={() => deleteBanner(banner.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card stack">
        <div className="admin-inline">
          <div style={{ fontWeight: 600 }}>Статистика (О нас)</div>
        </div>
        <p className="admin-subtitle">
          Данные для блока “О нас”: бейдж и показатели. Отображается на странице “О нас”.
        </p>

        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Значения</div>
            {aboutStats.stats.map((stat, idx) => (
              <label key={stat.id} className="admin-field">
                Значение #{idx + 1}
                <input
                  className="admin-input"
                  value={stat.value}
                  onChange={(e) => updateAboutStat(stat.id, { value: e.target.value })}
                />
              </label>
            ))}
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>RU</div>
            <label className="admin-field">
              Бейдж (RU)
              <input
                className="admin-input"
                value={aboutStats.badgeRu}
                onChange={(e) => updateAboutStats({ badgeRu: e.target.value })}
              />
            </label>
            {aboutStats.stats.map((stat, idx) => (
              <label key={stat.id} className="admin-field">
                Подпись #{idx + 1} (RU)
                <input
                  className="admin-input"
                  value={stat.labelRu || ""}
                  onChange={(e) => updateAboutStat(stat.id, { labelRu: e.target.value })}
                />
              </label>
            ))}
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>UZ</div>
            <label className="admin-field">
              Бейдж (UZ)
              <input
                className="admin-input"
                value={aboutStats.badgeUz}
                onChange={(e) => updateAboutStats({ badgeUz: e.target.value })}
              />
            </label>
            {aboutStats.stats.map((stat, idx) => (
              <label key={stat.id} className="admin-field">
                Подпись #{idx + 1} (UZ)
                <input
                  className="admin-input"
                  value={stat.labelUz || ""}
                  onChange={(e) => updateAboutStat(stat.id, { labelUz: e.target.value })}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="admin-inline">
          <button className="admin-button" disabled={aboutStatsSaving} onClick={saveAboutStats}>
            {aboutStatsSaving ? "..." : "Сохранить"}
          </button>
        </div>
      </section>

      <section className="admin-card stack">
        <div className="admin-inline">
          <div style={{ fontWeight: 600 }}>Локации (О нас)</div>
          <div className="admin-pill">Выбрано: {locations.length}/3</div>
        </div>
        <p className="admin-subtitle">
          Выберите 3 локации из Poster, задайте название и описание на RU/UZ, координаты и адрес.
        </p>

        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Выбранные локации</div>
            {locations.length === 0 ? (
              <div className="admin-subtitle">Пока не выбрано ни одной локации.</div>
            ) : (
              locations.map((loc) => {
                const mapSrc =
                  loc.lat && loc.lng
                    ? `https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed`
                    : "";
                return (
                  <div key={loc.id} className="admin-card stack" style={{ boxShadow: "none" }}>
                    <div className="admin-inline">
                      <div className="admin-subtitle">ID: {loc.id}</div>
                      {loc.spotId ? <div className="admin-pill">Poster: {loc.spotId}</div> : null}
                      <div className="admin-inline" style={{ marginLeft: "auto" }}>
                        <button
                          className="admin-button admin-button-muted"
                          onClick={() => moveLocation(loc.id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className="admin-button admin-button-muted"
                          onClick={() => moveLocation(loc.id, 1)}
                        >
                          ↓
                        </button>
                        <button
                          className="admin-button admin-button-muted"
                          onClick={() => removeLocation(loc.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    <div className="admin-grid">
                      <div className="admin-card stack" style={{ boxShadow: "none" }}>
                        <div style={{ fontWeight: 600 }}>RU</div>
                        <label className="admin-field">
                          Название (RU)
                          <input
                            className="admin-input"
                            value={loc.nameRu || ""}
                            onChange={(e) => updateLocation(loc.id, { nameRu: e.target.value })}
                          />
                        </label>
                        <label className="admin-field">
                          Адрес (RU)
                          <input
                            className="admin-input"
                            value={loc.addressRu || ""}
                            onChange={(e) => updateLocation(loc.id, { addressRu: e.target.value })}
                          />
                        </label>
                        <label className="admin-field">
                          Описание (RU)
                          <textarea
                            className="admin-textarea"
                            value={loc.descRu || ""}
                            onChange={(e) => updateLocation(loc.id, { descRu: e.target.value })}
                          />
                        </label>
                      </div>

                      <div className="admin-card stack" style={{ boxShadow: "none" }}>
                        <div style={{ fontWeight: 600 }}>UZ</div>
                        <label className="admin-field">
                          Название (UZ)
                          <input
                            className="admin-input"
                            value={loc.nameUz || ""}
                            onChange={(e) => updateLocation(loc.id, { nameUz: e.target.value })}
                          />
                        </label>
                        <label className="admin-field">
                          Адрес (UZ)
                          <input
                            className="admin-input"
                            value={loc.addressUz || ""}
                            onChange={(e) => updateLocation(loc.id, { addressUz: e.target.value })}
                          />
                        </label>
                        <label className="admin-field">
                          Описание (UZ)
                          <textarea
                            className="admin-textarea"
                            value={loc.descUz || ""}
                            onChange={(e) => updateLocation(loc.id, { descUz: e.target.value })}
                          />
                        </label>
                      </div>

                      <div className="admin-card stack" style={{ boxShadow: "none" }}>
                        <div style={{ fontWeight: 600 }}>Координаты</div>
                        <label className="admin-field">
                          Широта (lat)
                          <input
                            className="admin-input"
                            value={loc.lat ?? ""}
                            onChange={(e) =>
                              updateLocation(loc.id, {
                                lat: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                          />
                        </label>
                        <label className="admin-field">
                          Долгота (lng)
                          <input
                            className="admin-input"
                            value={loc.lng ?? ""}
                            onChange={(e) =>
                              updateLocation(loc.id, {
                                lng: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                          />
                        </label>
                        {mapSrc ? (
                          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
                            <iframe
                              title={`map-${loc.id}`}
                              src={mapSrc}
                              style={{ width: "100%", height: 180, border: 0 }}
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="admin-subtitle">Добавьте координаты для карты.</div>
                        )}
                        {loc.lat && loc.lng ? (
                          <a
                            className="admin-button admin-button-muted"
                            href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Открыть карту
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Заведения из Poster</div>
            <input
              className="admin-input"
              placeholder="Поиск по названию или адресу..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
            <div className="stack">
              {filteredSpots.map((spot) => {
                const isSelected = locations.some((l) => l.spotId === spot.spot_id);
                return (
                  <div key={spot.spot_id} className="admin-inline">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{spot.name}</div>
                      <div className="admin-subtitle">{spot.address}</div>
                      <div className="admin-subtitle">
                        {spot.lat && spot.lng ? `${spot.lat}, ${spot.lng}` : "Координаты не заданы"}
                      </div>
                    </div>
                    <button
                      className="admin-button"
                      disabled={isSelected || locations.length >= 3}
                      onClick={() => addLocationFromSpot(spot)}
                    >
                      {isSelected ? "Добавлено" : "Добавить"}
                    </button>
                  </div>
                );
              })}
            </div>
            {locations.length >= 3 ? (
              <div className="admin-subtitle">Можно выбрать максимум 3 локации.</div>
            ) : null}
          </div>
        </div>

        <div className="admin-inline">
          <button className="admin-button" disabled={locationsSaving} onClick={saveLocations}>
            {locationsSaving ? "..." : "Сохранить"}
          </button>
          <div className="admin-subtitle">Эти локации появятся на странице “О нас”.</div>
        </div>
      </section>

      <section className="admin-card stack">
        <div className="admin-inline">
          <div style={{ fontWeight: 600 }}>Популярные товары</div>
          <div className="admin-pill">Выбрано: {popularIds.length}</div>
        </div>
        <p className="admin-subtitle">
          Выберите товары для главной страницы. Порядок отображения сохраняется.
        </p>

        <div className="admin-grid">
          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Выбрано</div>
            {selectedProducts.length === 0 ? (
              <div className="admin-subtitle">Пока ничего не выбрано.</div>
            ) : (
              selectedProducts.map((p) => {
                const id = normalizeText(p.product_id ?? "");
                const name = normalizeText(p.product_name ?? "") || "Без названия";
                const category = normalizeText(p.category_name ?? "");
                const photo = p.photo_origin || p.photo || p.image || "";

                return (
                  <div key={id} className="admin-inline" style={{ alignItems: "flex-start" }}>
                    <div className="admin-media" style={{ flex: 1 }}>
                      <div className="admin-thumb" style={{ width: 76, height: 76 }}>
                        {photo ? (
                          <img src={photo} alt={name} loading="lazy" />
                        ) : (
                          <div className="admin-thumb__empty">Нет фото</div>
                        )}
                      </div>
                      <div className="stack" style={{ gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        {category ? (
                          <div className="admin-subtitle">{category}</div>
                        ) : null}
                        <div className="admin-subtitle">ID: {id}</div>
                      </div>
                    </div>
                    <div className="admin-inline" style={{ marginLeft: "auto" }}>
                      <button
                        className="admin-button admin-button-muted"
                        onClick={() => movePopular(id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        className="admin-button admin-button-muted"
                        onClick={() => movePopular(id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        className="admin-button admin-button-muted"
                        onClick={() => removePopular(id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="admin-card stack" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 600 }}>Все товары</div>
            <input
              className="admin-input"
              placeholder="Поиск товара или категории..."
              value={popularQuery}
              onChange={(e) => setPopularQuery(e.target.value)}
            />
            <div className="stack">
              {filteredProducts.slice(0, 80).map((p) => {
                const id = normalizeText(p.product_id ?? "");
                const name = normalizeText(p.product_name ?? "") || "Без названия";
                const category = normalizeText(p.category_name ?? "");
                const photo = p.photo_origin || p.photo || p.image || "";

                return (
                  <div key={id} className="admin-inline" style={{ alignItems: "flex-start" }}>
                    <div className="admin-media" style={{ flex: 1 }}>
                      <div className="admin-thumb" style={{ width: 70, height: 70 }}>
                        {photo ? (
                          <img src={photo} alt={name} loading="lazy" />
                        ) : (
                          <div className="admin-thumb__empty">Нет фото</div>
                        )}
                      </div>
                      <div className="stack" style={{ gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        {category ? (
                          <div className="admin-subtitle">{category}</div>
                        ) : null}
                        <div className="admin-subtitle">ID: {id}</div>
                      </div>
                    </div>
                    <button className="admin-button" onClick={() => addPopular(id)}>
                      Добавить
                    </button>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length > 80 ? (
              <div className="admin-subtitle">Показаны первые 80 результатов.</div>
            ) : null}
          </div>
        </div>

        <div className="admin-inline">
          <button className="admin-button" disabled={popularSaving} onClick={savePopular}>
            {popularSaving ? "..." : "Сохранить"}
          </button>
          <div className="admin-subtitle">
            Эти товары появятся в карусели на главной странице.
          </div>
        </div>
      </section>

      {CONTENT_SECTIONS.map((section) => (
        <section key={section.slug} className="admin-card stack">
          <div style={{ fontWeight: 600 }}>{section.title}</div>
          <div className="admin-grid">
            {(["ru", "uz"] as const).map((locale) => {
              const key = contentKey(section.slug, locale);
              const row = content[key] || ({ slug: section.slug, locale } as ContentPage);

              return (
                <div key={key} className="admin-card stack" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 600 }}>{locale.toUpperCase()}</div>
                  <label className="admin-field">
                    Заголовок
                    <input
                      className="admin-input"
                      value={row.title || ""}
                      onChange={(e) => updateContent(section.slug, locale, { title: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Текст
                    <textarea
                      className="admin-textarea"
                      value={row.body || ""}
                      onChange={(e) => updateContent(section.slug, locale, { body: e.target.value })}
                    />
                  </label>
                  <div className="admin-divider" />
                  <label className="admin-field">
                    Meta title
                    <input
                      className="admin-input"
                      value={row.seoTitle || ""}
                      onChange={(e) => updateContent(section.slug, locale, { seoTitle: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Meta description
                    <textarea
                      className="admin-textarea"
                      value={row.seoDescription || ""}
                      onChange={(e) => updateContent(section.slug, locale, { seoDescription: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    Meta keywords
                    <input
                      className="admin-input"
                      placeholder="ключ1, ключ2, ключ3"
                      value={row.seoKeywords || ""}
                      onChange={(e) => updateContent(section.slug, locale, { seoKeywords: e.target.value })}
                    />
                  </label>
                  <button
                    className="admin-button"
                    style={{ width: "100%" }}
                    disabled={savingContentKey === key}
                    onClick={() => saveContent(section.slug, locale)}
                  >
                    {savingContentKey === key ? "..." : "Сохранить"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
