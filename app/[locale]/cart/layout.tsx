import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";

const FALLBACK = {
  ru: {
    title: "Корзина Wasabi — оформить заказ",
    description: "Проверьте выбранные блюда и оформите заказ на доставку Wasabi.",
    keywords: "wasabi, корзина, заказать суши, доставка",
  },
  uz: {
    title: "Wasabi savat — buyurtma berish",
    description: "Tanlangan taomlarni tekshiring va Wasabi buyurtmasini rasmiylashtiring.",
    keywords: "wasabi, savat, sushi buyurtma, yetkazib berish",
  },
};

async function getSeoMeta(locale: Locale) {
  const row = await prisma.seoMeta.findUnique({
    where: { page_locale: { page: "cart", locale } },
  });
  const fallback = FALLBACK[locale];
  return {
    title: row?.title || fallback.title,
    description: row?.description || fallback.description,
    keywords: row?.keywords || fallback.keywords,
    ogImage: row?.ogImage || null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const seo = await getSeoMeta(locale);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: seo.ogImage
      ? {
          title: seo.title,
          description: seo.description,
          images: [seo.ogImage],
        }
      : undefined,
  };
}

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
