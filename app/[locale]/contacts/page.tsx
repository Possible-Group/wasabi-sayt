import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const COPY: Record<Locale, {
  title: string;
  subtitle: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  phoneLabel: string;
  addressLabel: string;
  hoursLabel: string;
  socialsLabel: string;
}> = {
  ru: {
    title: "Контакты и адрес",
    subtitle: "Свяжитесь с нами или найдите ближайший адрес.",
    body: "Мы всегда на связи и поможем с заказом или доставкой.",
    seoTitle: "Контакты Wasabi Sushi",
    seoDescription: "Телефоны, адрес и контакты Wasabi Sushi.",
    seoKeywords: "wasabi, контакты, телефон, адрес",
    phoneLabel: "Телефон",
    addressLabel: "Адрес",
    hoursLabel: "График работы",
    socialsLabel: "Мы в соцсетях",
  },
  uz: {
    title: "Aloqa va manzil",
    subtitle: "Biz bilan bog'laning yoki yaqin manzilni toping.",
    body: "Biz har doim aloqadamiz va buyurtma bo'yicha yordam beramiz.",
    seoTitle: "Wasabi Sushi aloqa",
    seoDescription: "Wasabi Sushi telefonlari, manzil va aloqa ma'lumotlari.",
    seoKeywords: "wasabi, aloqa, telefon, manzil",
    phoneLabel: "Telefon",
    addressLabel: "Manzil",
    hoursLabel: "Ish vaqti",
    socialsLabel: "Ijtimoiy tarmoqlar",
  },
};

type ContentData = {
  title: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

async function getContent(locale: Locale): Promise<ContentData> {
  const fallback = COPY[locale];
  const row = await prisma.contentPage.findUnique({
    where: { slug_locale: { slug: "contacts", locale } },
  });
  return {
    title: row?.title || fallback.title,
    body: row?.body || fallback.body,
    seoTitle: row?.seoTitle || row?.title || fallback.seoTitle,
    seoDescription: row?.seoDescription || fallback.seoDescription,
    seoKeywords: row?.seoKeywords || fallback.seoKeywords,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const content = await getContent(locale);
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    keywords: content.seoKeywords,
  };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const copy = COPY[locale];
  const content = await getContent(locale);

  const settings = await prisma.botSetting.findMany({
    where: {
      key: {
        in: [
          "contact_phone",
          "contact_phone_2",
          "contact_phone_3",
          "contact_phone_4",
          "contact_address_ru",
          "contact_address_uz",
          "work_start",
          "work_end",
          "social_instagram",
          "social_telegram",
        ],
      },
    },
  });

  const map: Record<string, string> = {};
  for (const item of settings) map[item.key] = item.value ?? "";

  const phones = [
    map.contact_phone,
    map.contact_phone_2,
    map.contact_phone_3,
    map.contact_phone_4,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const phoneList = phones.length ? phones : ["+998 90 000 00 00"];
  const address =
    locale === "uz"
      ? map.contact_address_uz || map.contact_address_ru || "Toshkent, shahar bo'ylab yetkazib berish"
      : map.contact_address_ru || map.contact_address_uz || "Ташкент, доставка по городу";
  const hours = `Ежедневно ${map.work_start || "10:00"} — ${map.work_end || "23:00"}`;
  const hoursUz = `Har kuni ${map.work_start || "10:00"} — ${map.work_end || "23:00"}`;
  const socials = [
    { label: "Instagram", href: normalizeUrl(map.social_instagram || "") },
    { label: "Telegram", href: normalizeUrl(map.social_telegram || "") },
  ].filter((item) => item.href);

  return (
    <div className="ws-page">
      <Header locale={locale} />
      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <p className="site-eyebrow">{content.title}</p>
            <h1 className="site-title">{content.title}</h1>
            <p className="site-subtitle">{copy.subtitle}</p>
            <div className="site-subtitle" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
              {content.body}
            </div>

            <div className="site-card" style={{ marginTop: 18, display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{copy.phoneLabel}</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {phoneList.map((phone) => (
                    <a key={phone} href={`tel:${phone}`} style={{ color: "inherit" }}>
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{copy.addressLabel}</div>
                <div>{address}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{copy.hoursLabel}</div>
                <div>{locale === "uz" ? hoursUz : hours}</div>
              </div>
              {socials.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700 }}>{copy.socialsLabel}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                    {socials.map((item) => (
                      <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
