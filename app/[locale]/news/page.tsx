import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

type NewsItem = {
  id: number;
  slug: string;
  imageUrl: string;
  titleRu: string;
  titleUz: string;
  excerptRu: string;
  excerptUz: string;
  publishedAt: Date | null;
  createdAt: Date;
};

const SEO_COPY: Record<Locale, { title: string; description: string }> = {
  ru: {
    title: "Новости",
    description: "Новости Wasabi, акции и обновления меню.",
  },
  uz: {
    title: "Yangiliklar",
    description: "Wasabi yangiliklari, aksiyalar va menyu yangilanishlari.",
  },
};

function pickLocale(item: NewsItem, key: "title" | "excerpt", locale: Locale) {
  const ru = key === "title" ? item.titleRu : item.excerptRu;
  const uz = key === "title" ? item.titleUz : item.excerptUz;
  return locale === "uz" ? uz || ru : ru || uz;
}

function formatDate(value: Date | null, locale: Locale) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  return {
    title: SEO_COPY[locale].title,
    description: SEO_COPY[locale].description,
  };
}

async function getNews() {
  return prisma.newsItem.findMany({
    where: { active: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      slug: true,
      imageUrl: true,
      titleRu: true,
      titleUz: true,
      excerptRu: true,
      excerptUz: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const items = await getNews();

  return (
    <div className="ws-page">
      <Header locale={locale} />
      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <div className="site-section__head">
              <div>
                <p className="site-eyebrow">{locale === "uz" ? "Yangiliklar" : "Новости"}</p>
                <h1 className="site-title">{SEO_COPY[locale].title}</h1>
                <p className="site-subtitle">{SEO_COPY[locale].description}</p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="site-card">
                {locale === "uz"
                  ? "Hozircha yangiliklar yo'q."
                  : "Пока нет новостей."}
              </div>
            ) : (
              <div className="site-grid site-grid-3 news-grid">
                {items.map((item) => {
                  const title = pickLocale(item, "title", locale);
                  const excerpt = pickLocale(item, "excerpt", locale);
                  const date = formatDate(item.publishedAt ?? item.createdAt, locale);
                  return (
                    <Link
                      key={item.id}
                      href={`/${locale}/news/${item.slug}`}
                      className="site-card news-card"
                    >
                      <div className="news-thumb">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={title} loading="lazy" />
                        ) : (
                          <div className="news-thumb__empty" />
                        )}
                      </div>
                      <div className="news-meta">
                        <span>{date}</span>
                        <span>{locale === "uz" ? "Batafsil" : "Подробнее"}</span>
                      </div>
                      <div className="news-title">{title}</div>
                      <div className="news-excerpt">{excerpt}</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
