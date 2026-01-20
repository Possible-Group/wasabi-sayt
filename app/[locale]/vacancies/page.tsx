import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";

const COPY: Record<Locale, { title: string; subtitle: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }> = {
  ru: {
    title: "Вакансии",
    subtitle: "Присоединяйтесь к команде Wasabi.",
    body: "Если хотите работать у нас — напишите в Instagram или Telegram. Мы ответим и расскажем о доступных вакансиях.",
    seoTitle: "Вакансии Wasabi Sushi",
    seoDescription: "Открытые вакансии и работа в Wasabi Sushi.",
    seoKeywords: "wasabi, вакансии, работа",
  },
  uz: {
    title: "Bo'sh ish o'rinlari",
    subtitle: "Wasabi jamoasiga qo'shiling.",
    body: "Bizda ishlashni istasangiz — Instagram yoki Telegram orqali yozing. Mavjud bo'sh ish o'rinlari haqida ma'lumot beramiz.",
    seoTitle: "Wasabi Sushi bo'sh ish o'rinlari",
    seoDescription: "Wasabi Sushi bo'sh ish o'rinlari va ishga qabul.",
    seoKeywords: "wasabi, ish, vakansiya",
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
    where: { slug_locale: { slug: "vacancies", locale } },
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

export default async function VacanciesPage({
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
            <div className="site-card" style={{ marginTop: 18 }}>
              <p className="site-subtitle" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {content.body}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
