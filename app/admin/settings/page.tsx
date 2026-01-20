"use client";

import { useEffect, useState } from "react";
import { emitAdminToast } from "@/lib/admin/adminToast";

type Settings = Record<string, string>;

async function getSettings(): Promise<Settings> {
  const r = await fetch("/api/admin/settings", { cache: "no-store" });
  return r.json();
}

async function setSetting(key: string, value: string) {
  const r = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, data };
}

export default function AdminSettingsPage() {
  const [s, setS] = useState<Settings>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setS);
  }, []);

  function v(key: string, def = "") {
    return s[key] ?? def;
  }

  async function save(key: string, value: string) {
    setSaving(true);
    try {
      const { ok, data } = await setSetting(key, value);
      if (!ok) {
        emitAdminToast(data?.error || "Ошибка сохранения", "error");
        return;
      }
      setS((p) => ({ ...p, [key]: value }));
      emitAdminToast("Сохранено");
    } catch (error) {
      emitAdminToast("Ошибка сохранения", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Настройки</h1>
        <p className="admin-subtitle">Общие параметры и системные переключатели.</p>
      </div>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Время работы</div>
        <div className="admin-grid">
          <label className="admin-field">
            Начало (HH:MM)
            <input
              className="admin-input"
              value={v("work_start", "10:00")}
              onChange={(e) => setS((p) => ({ ...p, work_start: e.target.value }))}
              onBlur={() => save("work_start", v("work_start", "10:00"))}
            />
          </label>
          <label className="admin-field">
            Конец (HH:MM)
            <input
              className="admin-input"
              value={v("work_end", "23:00")}
              onChange={(e) => setS((p) => ({ ...p, work_end: e.target.value }))}
              onBlur={() => save("work_end", v("work_end", "23:00"))}
            />
          </label>
        </div>
        <div className="admin-subtitle">
          Поддерживается ночной график (например 10:00-02:00).
        </div>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Сайт</div>
        <label
          className="admin-field"
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>Сайт включен</span>
          <input
            type="checkbox"
            checked={v("site_enabled", "1") === "1"}
            onChange={(e) => save("site_enabled", e.target.checked ? "1" : "0")}
          />
        </label>
        <div className="admin-subtitle">
          Если выключено — пользователи увидят страницу обслуживания.
        </div>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Сборы</div>
        <label className="admin-field">
          Упаковка (сум)
          <input
            className="admin-input"
            value={v("package_fee", "0")}
            onChange={(e) => setS((p) => ({ ...p, package_fee: e.target.value }))}
            onBlur={() => save("package_fee", v("package_fee", "0"))}
          />
        </label>
        <label className="admin-field">
          Доставка (сум)
          <input
            className="admin-input"
            value={v("delivery_fee", "0")}
            onChange={(e) => setS((p) => ({ ...p, delivery_fee: e.target.value }))}
            onBlur={() => save("delivery_fee", v("delivery_fee", "0"))}
          />
        </label>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Контакты</div>
        <label className="admin-field">
          Телефон
          <input
            className="admin-input"
            value={v("contact_phone", "+998 90 000 00 00")}
            onChange={(e) => setS((p) => ({ ...p, contact_phone: e.target.value }))}
            onBlur={() => save("contact_phone", v("contact_phone", "+998 90 000 00 00"))}
          />
        </label>
        <label className="admin-field">
          Телефон 2
          <input
            className="admin-input"
            value={v("contact_phone_2", "")}
            onChange={(e) => setS((p) => ({ ...p, contact_phone_2: e.target.value }))}
            onBlur={() => save("contact_phone_2", v("contact_phone_2", ""))}
          />
        </label>
        <label className="admin-field">
          Телефон 3
          <input
            className="admin-input"
            value={v("contact_phone_3", "")}
            onChange={(e) => setS((p) => ({ ...p, contact_phone_3: e.target.value }))}
            onBlur={() => save("contact_phone_3", v("contact_phone_3", ""))}
          />
        </label>
        <label className="admin-field">
          Телефон 4
          <input
            className="admin-input"
            value={v("contact_phone_4", "")}
            onChange={(e) => setS((p) => ({ ...p, contact_phone_4: e.target.value }))}
            onBlur={() => save("contact_phone_4", v("contact_phone_4", ""))}
          />
        </label>
        <div className="admin-grid">
          <label className="admin-field">
            Адрес RU
            <input
              className="admin-input"
              value={v("contact_address_ru", "Ташкент, доставка по городу")}
              onChange={(e) => setS((p) => ({ ...p, contact_address_ru: e.target.value }))}
              onBlur={() =>
                save("contact_address_ru", v("contact_address_ru", "Ташкент, доставка по городу"))
              }
            />
          </label>
          <label className="admin-field">
            Адрес UZ
            <input
              className="admin-input"
              value={v("contact_address_uz", "Toshkent, shahar bo'ylab yetkazib berish")}
              onChange={(e) => setS((p) => ({ ...p, contact_address_uz: e.target.value }))}
              onBlur={() =>
                save(
                  "contact_address_uz",
                  v("contact_address_uz", "Toshkent, shahar bo'ylab yetkazib berish")
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Соцсети</div>
        <label className="admin-field">
          Instagram
          <input
            className="admin-input"
            placeholder="https://instagram.com/..."
            value={v("social_instagram", "")}
            onChange={(e) => setS((p) => ({ ...p, social_instagram: e.target.value }))}
            onBlur={() => save("social_instagram", v("social_instagram", ""))}
          />
        </label>
        <label className="admin-field">
          Telegram
          <input
            className="admin-input"
            placeholder="https://t.me/..."
            value={v("social_telegram", "")}
            onChange={(e) => setS((p) => ({ ...p, social_telegram: e.target.value }))}
            onBlur={() => save("social_telegram", v("social_telegram", ""))}
          />
        </label>
        <label className="admin-field">
          Facebook
          <input
            className="admin-input"
            placeholder="https://facebook.com/..."
            value={v("social_facebook", "")}
            onChange={(e) => setS((p) => ({ ...p, social_facebook: e.target.value }))}
            onBlur={() => save("social_facebook", v("social_facebook", ""))}
          />
        </label>
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Языки</div>

        <label
          className="admin-field"
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>RU включен</span>
          <input
            type="checkbox"
            checked={v("lang_ru_enabled", "1") === "1"}
            onChange={(e) => save("lang_ru_enabled", e.target.checked ? "1" : "0")}
          />
        </label>

        <label
          className="admin-field"
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>UZ включен</span>
          <input
            type="checkbox"
            checked={v("lang_uz_enabled", "1") === "1"}
            onChange={(e) => save("lang_uz_enabled", e.target.checked ? "1" : "0")}
          />
        </label>
      </section>

      <div className="admin-subtitle">{saving ? "Сохраняю..." : "Готово"}</div>
    </div>
  );
}
