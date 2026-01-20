import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";

const COPY: Record<Locale, { title: string; subtitle: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string; cta: string }> = {
  ru: {
    title: "Акции",
    subtitle: "Следите за нашими новостями — там появляются все актуальные акции и скидки.",
    body: "Все актуальные предложения публикуются в новостях. Заглядывайте чаще!",
    seoTitle: "Акции Wasabi Sushi",
    seoDescription: "Актуальные акции и скидки Wasabi Sushi.",
    seoKeywords: "wasabi, акции, скидки",
    cta: "Перейти к новостям",
  },
  uz: {
    title: "Aksiyalar",
    subtitle: "Eng so'nggi aksiyalar va chegirmalar yangiliklar bo'limida.",
    body: "Barcha dolzarb takliflar yangiliklar bo'limida joylashtiriladi.",
    seoTitle: "Wasabi Sushi aksiyalar",
    seoDescription: "Wasabi Sushi aksiyalari va chegirmalari.",
    seoKeywords: "wasabi, aksiya, chegirma",
    cta: "Yangiliklarga o'tish",
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
    where: { slug_locale: { slug: "promotions", locale } },
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

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const copy = COPY[locale];
  const content = await getContent(locale);

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
            <div style={{ marginTop: 16 }}>
              <Link className="site-button site-button--primary" href={`/${locale}/news`}>
                {copy.cta}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
