import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LocationsSection, { type AboutLocation } from "@/components/about/LocationsSection";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";

type ContentData = {
  title: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

type AboutStat = {
  id: string;
  value: string;
  labelRu?: string | null;
  labelUz?: string | null;
};

type AboutStatsData = {
  badgeRu: string;
  badgeUz: string;
  stats: AboutStat[];
};

const FALLBACK: Record<Locale, ContentData> = {
  ru: {
    title: "О нас",
    body: "Расскажите о вашем ресторане и команде. Добавьте историю бренда и ценности.",
    seoTitle: "О нас",
    seoDescription: "Информация о Wasabi: команда, философия и подход к качеству.",
    seoKeywords: "wasabi, суши, о нас, ресторан",
  },
  uz: {
    title: "Biz haqimizda",
    body: "Restoraningiz va jamoangiz haqida hikoya qiling. Brend tarixi va qadriyatlarni yozing.",
    seoTitle: "Biz haqimizda",
    seoDescription: "Wasabi haqida ma'lumot: jamoa va sifatga yondashuv.",
    seoKeywords: "wasabi, sushi, biz haqimizda, restoran",
  },
};

const STATS_FALLBACK: AboutStatsData = {
  badgeRu: "С заботой о вкусе",
  badgeUz: "Muhabbat bilan tayyorlanadi",
  stats: [
    { id: "exp", value: "15+", labelRu: "Лет опыта", labelUz: "Yil tajriba" },
    { id: "menu", value: "80+", labelRu: "Позиции в меню", labelUz: "Taomlar menyuda" },
    { id: "loc", value: "4", labelRu: "Локации", labelUz: "Lokatsiya" },
  ],
};

async function getContent(locale: Locale) {
  const row = await prisma.contentPage.findUnique({
    where: { slug_locale: { slug: "about", locale } },
  });
  const fallback = FALLBACK[locale];
  return {
    title: row?.title || fallback.title,
    body: row?.body || fallback.body,
    seoTitle: row?.seoTitle || row?.title || fallback.seoTitle,
    seoDescription: row?.seoDescription || fallback.seoDescription,
    seoKeywords: row?.seoKeywords || fallback.seoKeywords,
  } as ContentData;
}

async function getLocations() {
  const row = await prisma.botSetting.findUnique({ where: { key: "about_locations" } });
  if (!row?.value) return [] as AboutLocation[];
  try {
    const data = JSON.parse(row.value);
    if (!Array.isArray(data)) return [];
    return data
      .map((loc: any) => ({
        id: String(loc?.id ?? ""),
        nameRu: loc?.nameRu ?? null,
        nameUz: loc?.nameUz ?? null,
        addressRu: loc?.addressRu ?? null,
        addressUz: loc?.addressUz ?? null,
        descRu: loc?.descRu ?? null,
        descUz: loc?.descUz ?? null,
        lat: typeof loc?.lat === "number" ? loc.lat : loc?.lat ? Number(loc.lat) : null,
        lng: typeof loc?.lng === "number" ? loc.lng : loc?.lng ? Number(loc.lng) : null,
      }))
      .filter((loc: AboutLocation) => loc.id);
  } catch {
    return [];
  }
}

async function getStats() {
  const row = await prisma.botSetting.findUnique({ where: { key: "about_stats" } });
  if (!row?.value) return STATS_FALLBACK;
  try {
    const data = JSON.parse(row.value);
    if (!data || typeof data !== "object") return STATS_FALLBACK;
    const stats = Array.isArray(data.stats) ? data.stats : [];
    return {
      badgeRu: typeof data.badgeRu === "string" ? data.badgeRu : STATS_FALLBACK.badgeRu,
      badgeUz: typeof data.badgeUz === "string" ? data.badgeUz : STATS_FALLBACK.badgeUz,
      stats: stats.length ? stats : STATS_FALLBACK.stats,
    } as AboutStatsData;
  } catch {
    return STATS_FALLBACK;
  }
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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const content = await getContent(locale);
  const locations = await getLocations();
  const stats = await getStats();
  const badge = locale === "uz" ? stats.badgeUz : stats.badgeRu;

  return (
    <div className="ws-page">
      <Header locale={locale} />

      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <div className="about-hero">
              <div>
                <p className="site-eyebrow">{locale === "uz" ? "Wasabi" : "Wasabi"}</p>
                <h1 className="site-title">{content.title}</h1>
                <p className="site-subtitle">
                  {locale === "uz"
                    ? "Bizning oshxona va jamoamiz haqida bilib oling."
                    : "Узнайте больше о нашей кухне и команде."}
                </p>
                <div className="about-hero__text" style={{ whiteSpace: "pre-wrap" }}>
                  {content.body}
                </div>
              </div>
              <div className="about-hero__aside">
                <div className="about-hero__badge">{badge}</div>
                <div className="about-hero__card">
                  {stats.stats.map((stat) => (
                    <div key={stat.id} className="about-hero__stat">
                      <strong>{stat.value}</strong>
                      <span>
                        {locale === "uz"
                          ? stat.labelUz || stat.labelRu
                          : stat.labelRu || stat.labelUz}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {locations.length > 0 ? (
          <section className="site-section">
            <div className="ws-container">
              <div className="site-section__head">
                <div>
                  <p className="site-eyebrow">{locale === "uz" ? "Lokatsiyalar" : "Локации"}</p>
                  <h2 className="site-title">
                    {locale === "uz" ? "Bizning manzillar" : "Наши адреса"}
                  </h2>
                  <p className="site-subtitle">
                    {locale === "uz"
                      ? "Eng yaqin filialni tanlang va xaritada ko'ring."
                      : "Выберите ближайший филиал и посмотрите на карте."}
                  </p>
                </div>
              </div>
              <LocationsSection locale={locale} locations={locations} />
            </div>
          </section>
        ) : null}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
