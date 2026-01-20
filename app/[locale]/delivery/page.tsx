import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";

const COPY: Record<Locale, { title: string; subtitle: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }> = {
  ru: {
    title: "Доставка и оплата",
    subtitle: "Коротко о правилах доставки и способах оплаты.",
    body:
      "• Среднее время доставки — около 35–45 минут.\n" +
      "• Оплата: онлайн, наличными или картой курьеру.\n" +
      "• Мы принимаем заказы ежедневно с 10:00 до 23:00.",
    seoTitle: "Доставка и оплата Wasabi Sushi",
    seoDescription: "Условия доставки и оплаты Wasabi Sushi.",
    seoKeywords: "wasabi, доставка, оплата",
  },
  uz: {
    title: "Yetkazish va to'lov",
    subtitle: "Yetkazib berish qoidalari va to'lov usullari.",
    body:
      "• O'rtacha yetkazish vaqti — 35–45 daqiqa.\n" +
      "• To'lov: onlayn, naqd yoki karta orqali.\n" +
      "• Buyurtmalar har kuni 10:00 dan 23:00 gacha qabul qilinadi.",
    seoTitle: "Wasabi Sushi yetkazish va to'lov",
    seoDescription: "Wasabi Sushi yetkazib berish va to'lov shartlari.",
    seoKeywords: "wasabi, yetkazish, to'lov",
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
    where: { slug_locale: { slug: "delivery", locale } },
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

export default async function DeliveryPage({
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
              <div className="site-subtitle" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {content.body}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
