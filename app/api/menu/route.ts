import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const [settings, emojis, translations, categoryTranslations] = await Promise.all([
    prisma.botSetting.findMany(),
    prisma.categoryEmoji.findMany(),
    prisma.productTranslation.findMany(),
    prisma.categoryTranslation.findMany(),
  ]);

  const setMap: Record<string, string> = {};
  settings.forEach((s) => (setMap[s.key] = s.value));

  const emojiMap: Record<string, string> = {};
  emojis.forEach((e) => (emojiMap[e.categoryId] = e.emoji));

  const trMap: Record<
    string,
    {
      nameUz?: string | null;
      descUz?: string | null;
      seoTitleRu?: string | null;
      seoDescRu?: string | null;
      seoKeywordsRu?: string | null;
      seoTitleUz?: string | null;
      seoDescUz?: string | null;
      seoKeywordsUz?: string | null;
      hidden?: boolean | null;
    }
  > = {};
  translations.forEach((t) => {
    trMap[t.productId] = {
      nameUz: t.nameUz,
      descUz: t.descUz,
      seoTitleRu: t.seoTitleRu,
      seoDescRu: t.seoDescRu,
      seoKeywordsRu: t.seoKeywordsRu,
      seoTitleUz: t.seoTitleUz,
      seoDescUz: t.seoDescUz,
      seoKeywordsUz: t.seoKeywordsUz,
      hidden: t.hidden,
    };
  });

  const catMap: Record<
    string,
    {
      nameUz?: string | null;
      seoTitleRu?: string | null;
      seoDescRu?: string | null;
      seoKeywordsRu?: string | null;
      seoTitleUz?: string | null;
      seoDescUz?: string | null;
      seoKeywordsUz?: string | null;
    }
  > = {};
  categoryTranslations.forEach((t) => {
    catMap[t.categoryId] = {
      nameUz: t.nameUz,
      seoTitleRu: t.seoTitleRu,
      seoDescRu: t.seoDescRu,
      seoKeywordsRu: t.seoKeywordsRu,
      seoTitleUz: t.seoTitleUz,
      seoDescUz: t.seoDescUz,
      seoKeywordsUz: t.seoKeywordsUz,
    };
  });

  return NextResponse.json({
    settings: {
      work_start: setMap["work_start"] || "10:00",
      work_end: setMap["work_end"] || "23:00",
      package_fee: Number(setMap["package_fee"] || 0),
      delivery_fee: Number(setMap["delivery_fee"] || 0),
      contact_phone: setMap["contact_phone"] || "",
      contact_phone_2: setMap["contact_phone_2"] || "",
      contact_phone_3: setMap["contact_phone_3"] || "",
      contact_phone_4: setMap["contact_phone_4"] || "",
      contact_address_ru: setMap["contact_address_ru"] || "",
      contact_address_uz: setMap["contact_address_uz"] || "",
      social_instagram: setMap["social_instagram"] || "",
      social_telegram: setMap["social_telegram"] || "",
      social_facebook: setMap["social_facebook"] || "",
      lang_ru_enabled: (setMap["lang_ru_enabled"] ?? "1") === "1",
      lang_uz_enabled: (setMap["lang_uz_enabled"] ?? "1") === "1",
      site_enabled: (setMap["site_enabled"] ?? "1") === "1",
    },
    categoryEmoji: emojiMap,
    productTranslations: trMap,
    categoryTranslations: catMap,
  });
}
