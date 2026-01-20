"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const COPY = {
  ru: {
    tagline: "Суши и роллы с заботой о вкусе и скорости.",
    navTitle: "Разделы",
    contactTitle: "Контакты",
    hoursTitle: "График",
    nav: {
      home: "Главная",
      about: "О нас",
      news: "Новости",
      cart: "Корзина",
      contacts: "Контакты",
      delivery: "Доставка и оплата",
      promo: "Акции",
      catalog: "Меню",
    },
    hours: "Ежедневно 10:00 — 23:00",
    address: "Ташкент, доставка по городу",
    phone: "+998 90 000 00 00",
    rights: "Все права защищены",
    policy: "Политика",
    offer: "Оферта",
  },
  uz: {
    tagline: "Sushi va rollar — tez, chiroyli va mazali.",
    navTitle: "Bo'limlar",
    contactTitle: "Aloqa",
    hoursTitle: "Ish vaqti",
    nav: {
      home: "Bosh sahifa",
      about: "Biz haqimizda",
      news: "Yangiliklar",
      cart: "Savat",
      contacts: "Aloqa",
      delivery: "Yetkazish va to'lov",
      promo: "Aksiyalar",
      catalog: "Menyu",
    },
    hours: "Har kuni 10:00 — 23:00",
    address: "Toshkent, shahar bo'ylab yetkazib berish",
    phone: "+998 90 000 00 00",
    rights: "Barcha huquqlar himoyalangan",
    policy: "Siyosat",
    offer: "Oferta",
  },
};

export default function Footer({ locale = "ru" }: { locale?: string }) {
  const year = new Date().getFullYear();
  const copy = locale === "uz" ? COPY.uz : COPY.ru;
  const [workHours, setWorkHours] = useState({ start: "10:00", end: "23:00" });
  const [settings, setSettings] = useState({
    phone: "",
    phone2: "",
    phone3: "",
    phone4: "",
    addressRu: "",
    addressUz: "",
    instagram: "",
    telegram: "",
    facebook: "",
  });

  useEffect(() => {
    let active = true;
    fetch("/api/menu")
      .then((r) => r.json())
      .then((meta) => {
        if (!active) return;
        const start = meta?.settings?.work_start || "10:00";
        const end = meta?.settings?.work_end || "23:00";
        setWorkHours({ start, end });
        setSettings({
          phone: String(meta?.settings?.contact_phone ?? "").trim(),
          phone2: String(meta?.settings?.contact_phone_2 ?? "").trim(),
          phone3: String(meta?.settings?.contact_phone_3 ?? "").trim(),
          phone4: String(meta?.settings?.contact_phone_4 ?? "").trim(),
          addressRu: String(meta?.settings?.contact_address_ru ?? "").trim(),
          addressUz: String(meta?.settings?.contact_address_uz ?? "").trim(),
          instagram: String(meta?.settings?.social_instagram ?? "").trim(),
          telegram: String(meta?.settings?.social_telegram ?? "").trim(),
          facebook: String(meta?.settings?.social_facebook ?? "").trim(),
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const hoursText =
    locale === "uz"
      ? `Har kuni ${workHours.start} — ${workHours.end}`
      : `Ежедневно ${workHours.start} — ${workHours.end}`;
  const phoneList = [settings.phone, settings.phone2, settings.phone3, settings.phone4]
    .map((item) => item.trim())
    .filter(Boolean);
  const phones = phoneList.length ? phoneList : [copy.phone];
  const addressText =
    locale === "uz"
      ? settings.addressUz || settings.addressRu || copy.address
      : settings.addressRu || settings.addressUz || copy.address;
  const socialLinks = [
    { label: "Instagram", href: normalizeUrl(settings.instagram) },
    { label: "Telegram", href: normalizeUrl(settings.telegram) },
    { label: "Facebook", href: normalizeUrl(settings.facebook) },
  ].filter((item) => item.href);

  return (
    <footer className="site-footer">
      <div className="ws-container">
        <div className="site-footer__grid">
          <div>
            <div className="site-footer__brand">Wasabi</div>
            <p className="site-subtitle" style={{ color: "rgba(255,255,255,0.75)" }}>
              {copy.tagline}
            </p>
            {socialLinks.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    className="site-footer__link"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>{copy.navTitle}</div>
            <nav style={{ display: "grid", gap: 8 }}>
              <Link className="site-footer__link" href={`/${locale}`}>
                {copy.nav.home}
              </Link>
              <Link className="site-footer__link" href={`/${locale}#products`}>
                {copy.nav.catalog}
              </Link>
              <Link className="site-footer__link" href={`/${locale}/about`}>
                {copy.nav.about}
              </Link>
              <Link className="site-footer__link" href={`/${locale}/news`}>
                {copy.nav.news}
              </Link>
              <Link className="site-footer__link" href={`/${locale}/promotions`}>
                {copy.nav.promo}
              </Link>
              <Link className="site-footer__link" href={`/${locale}/delivery`}>
                {copy.nav.delivery}
              </Link>
              <Link className="site-footer__link" href={`/${locale}/contacts`}>
                {copy.nav.contacts}
              </Link>
              <Link className="site-footer__link" href={`/${locale}/cart`}>
                {copy.nav.cart}
              </Link>
            </nav>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>{copy.contactTitle}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {phones.map((phone) => (
                <a key={phone} className="site-footer__link" href={`tel:${phone}`}>
                  {phone}
                </a>
              ))}
            </div>
            <div className="site-footer__link">{addressText}</div>
            <div style={{ fontWeight: 700, marginTop: 14 }}>{copy.hoursTitle}</div>
            <div className="site-footer__link">{hoursText}</div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div>
            © {year} Wasabi • {copy.rights}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link className="site-footer__link" href={`/${locale}/policy`}>
              {copy.policy}
            </Link>
            <Link className="site-footer__link" href={`/${locale}/offer`}>
              {copy.offer}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
