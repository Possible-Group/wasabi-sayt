import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  bodyRu: string;
  bodyUz: string;
  seoTitleRu: string | null;
  seoDescriptionRu: string | null;
  seoKeywordsRu: string | null;
  seoTitleUz: string | null;
  seoDescriptionUz: string | null;
  seoKeywordsUz: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

function pickLocale(item: NewsItem, key: "title" | "excerpt" | "body", locale: Locale) {
  if (key === "title") {
    return locale === "uz" ? item.titleUz || item.titleRu : item.titleRu || item.titleUz;
  }
  if (key === "excerpt") {
    return locale === "uz" ? item.excerptUz || item.excerptRu : item.excerptRu || item.excerptUz;
  }
  return locale === "uz" ? item.bodyUz || item.bodyRu : item.bodyRu || item.bodyUz;
}

function pickSeo(item: NewsItem, locale: Locale) {
  if (locale === "uz") {
    return {
      title: item.seoTitleUz || item.titleUz || item.titleRu,
      description: item.seoDescriptionUz || item.excerptUz || item.excerptRu,
      keywords: item.seoKeywordsUz || undefined,
    };
  }
  return {
    title: item.seoTitleRu || item.titleRu || item.titleUz,
    description: item.seoDescriptionRu || item.excerptRu || item.excerptUz,
    keywords: item.seoKeywordsRu || undefined,
  };
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

async function getNewsItem(slug: string) {
  return prisma.newsItem.findFirst({
    where: { slug, active: true },
    select: {
      id: true,
      slug: true,
      imageUrl: true,
      titleRu: true,
      titleUz: true,
      excerptRu: true,
      excerptUz: true,
      bodyRu: true,
      bodyUz: true,
      seoTitleRu: true,
      seoDescriptionRu: true,
      seoKeywordsRu: true,
      seoTitleUz: true,
      seoDescriptionUz: true,
      seoKeywordsUz: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const item = await getNewsItem(p.slug);
  if (!item) return {};
  const seo = pickSeo(item, locale);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const item = await getNewsItem(p.slug);
  if (!item) return notFound();

  const title = pickLocale(item, "title", locale);
  const excerpt = pickLocale(item, "excerpt", locale);
  const body = pickLocale(item, "body", locale);
  const date = formatDate(item.publishedAt ?? item.createdAt, locale);

  return (
    <div className="ws-page">
      <Header locale={locale} />
      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <div className="site-section__head">
              <div>
                <p className="site-eyebrow">{locale === "uz" ? "Yangilik" : "Новость"}</p>
                <h1 className="site-title">{title}</h1>
                <p className="site-subtitle">{excerpt}</p>
                {date && <div className="news-date">{date}</div>}
                <Link href={`/${locale}/news`} className="site-link" style={{ marginTop: 12 }}>
                  {locale === "uz" ? "Barcha yangiliklar" : "Все новости"}
                </Link>
              </div>
            </div>

            <div className="news-detail">
              {item.imageUrl ? (
                <div className="news-detail__image">
                  <img src={item.imageUrl} alt={title} />
                </div>
              ) : null}
              <div className="site-card news-body" style={{ whiteSpace: "pre-wrap" }}>
                {body}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
