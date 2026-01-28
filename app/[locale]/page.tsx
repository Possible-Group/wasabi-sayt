import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BannerCarousel from "@/components/home/BannerCarousel";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Banner = {
  id: string;
  image: string;
  href: string;
};

type ProductCard = {
  id: string;
  title: string;
  price: string;
  image: string;
  href?: string;
  categoryId?: string | null;
  categoryTitle?: string;
};

type ReviewCard = {
  id: string;
  title: string;
  text: string;
  authorName: string;
  authorRole?: string;
  rating: number;
  photo: string;
  date: string;
};

const COPY = {
  ru: {
    seoTitle: "Wasabi Sushi — доставка суши и роллов в Ташкенте",
    seoDescription:
      "Закажите суши, роллы и сеты Wasabi с быстрой доставкой по Ташкенту. Свежие ингредиенты и современный вкус.",
    seoKeywords: "wasabi, суши, роллы, сеты, доставка, ташкент",
    heroEyebrow: "Свежий вкус каждый день",
    heroTitle: "Wasabi — современные роллы, точная доставка и чистый вкус.",
    heroText:
      "Готовим на заказ, подбираем идеальные сочетания и доставляем в темпе города. Сеты, роллы и горячие блюда — всё в одном меню.",
    heroSecondary: "Как мы готовим",
    heroFloating: "Хит недели • Филадельфия 2.0",
    stats: [
      { value: "35 мин", label: "Среднее время доставки" },
      { value: "4.9", label: "Рейтинг клиентов" },
      { value: "80+ позиций", label: "В меню каждый день" },
    ],
    featuresTitle: "Почему Wasabi",
    featuresSubtitle: "Сервис, который чувствуешь в каждом заказе.",
    features: [
      {
        title: "Свежие ингредиенты",
        text: "Каждый день поставки, строгий контроль качества.",
        icon: "🥢",
      },
      {
        title: "Тёплая доставка",
        text: "Термоупаковка, чтобы вкус остался ярким.",
        icon: "🚀",
      },
      {
        title: "Честная цена",
        text: "Баланс вкуса и стоимости без компромиссов.",
        icon: "✨",
      },
    ],
    productsTitle: "Популярные позиции",
    productsSubtitle: "Любимые роллы и сеты наших гостей.",
    addToCart: "Добавить",
    catalogTitle: "Все товары",
    catalogSubtitle: "Меню по категориям и актуальным позициям.",
    reviewsTitle: "Отзывы гостей",
    reviewsSubtitle: "Реальные впечатления от Wasabi.",
    ctaTitle: "Готовы оформить заказ?",
    ctaText: "Выберите сет, добавьте соусы и оформите доставку за пару минут.",
    ctaButton: "Сделать заказ",
    aboutAnchor: "О нас",
  },
  uz: {
    seoTitle: "Wasabi Sushi — Toshkentda sushi va roll yetkazib berish",
    seoDescription:
      "Wasabi menyusi: sushi, rollar va setlar. Toshkent bo'ylab tez yetkazib berish va yangi mahsulotlar.",
    seoKeywords: "wasabi, sushi, roll, set, yetkazib berish, toshkent",
    heroEyebrow: "Har kuni yangi ta'm",
    heroTitle: "Wasabi — zamonaviy rollar, tez yetkazish va toza ta'm.",
    heroText:
      "Buyurtmaga tayyorlaymiz, mukammal uyg'unliklarni tanlaymiz va shahar ritmida yetkazamiz. Setlar, rollar va issiq taomlar — hammasi bir menyuda.",
    heroSecondary: "Qanday tayyorlaymiz",
    heroFloating: "Hafta xiti • Filadelfiya 2.0",
    stats: [
      { value: "35 daqiqa", label: "O'rtacha yetkazish vaqti" },
      { value: "4.9", label: "Mijozlar reytingi" },
      { value: "80+ ta", label: "Har kuni menyuda" },
    ],
    featuresTitle: "Nega Wasabi",
    featuresSubtitle: "Xizmatni birinchi buyurtmadan his qilasiz.",
    features: [
      {
        title: "Yangi mahsulotlar",
        text: "Har kuni yangi yetkazib berish va sifat nazorati.",
        icon: "🥢",
      },
      {
        title: "Issiq yetkazish",
        text: "Termo-qadoq bilan ta'm saqlanadi.",
        icon: "🚀",
      },
      {
        title: "To'g'ri narx",
        text: "Ta'm va narx muvozanati.",
        icon: "✨",
      },
    ],
    productsTitle: "Mashhur taomlar",
    productsSubtitle: "Mehmonlarimiz eng ko'p tanlaydigan rollar.",
    addToCart: "Qo'shish",
    catalogTitle: "Barcha taomlar",
    catalogSubtitle: "Kategoriyalar bo'yicha to'liq menyu.",
    reviewsTitle: "Sharhlar",
    reviewsSubtitle: "Wasabi haqidagi haqiqiy fikrlar.",
    ctaTitle: "Buyurtma berishga tayyormisiz?",
    ctaText: "Setni tanlang, sous qo'shing va tezda yetkazishni rasmiylashtiring.",
    ctaButton: "Buyurtma berish",
    aboutAnchor: "Biz haqimizda",
  },
};

function svgDataUrl(label: string) {
  const safe = label.replace(/[<>]/g, "");
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='#2f6b3c'/>
        <stop offset='0.55' stop-color='#d08a4b'/>
        <stop offset='1' stop-color='#f6d1a6'/>
      </linearGradient>
      <radialGradient id='r' cx='35%' cy='30%' r='70%'>
        <stop offset='0' stop-color='rgba(255,255,255,0.28)'/>
        <stop offset='1' stop-color='rgba(255,255,255,0)'/>
      </radialGradient>
      <filter id='blur' x='-20%' y='-20%' width='140%' height='140%'>
        <feGaussianBlur stdDeviation='28'/>
      </filter>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <circle cx='320' cy='220' r='210' fill='url(#r)' filter='url(#blur)'/>
    <circle cx='880' cy='520' r='260' fill='url(#r)' filter='url(#blur)'/>
    <g opacity='0.9'>
      <text x='70' y='120' font-size='44' font-family='Montserrat, Arial, sans-serif' fill='rgba(255,255,255,0.92)'>WASABI • SUSHI</text>
      <text x='70' y='180' font-size='30' font-family='Montserrat, Arial, sans-serif' fill='rgba(255,255,255,0.82)'>${safe}</text>
      <text x='70' y='250' font-size='96' font-family='Montserrat, Arial, sans-serif' fill='rgba(255,255,255,0.95)'>🍣</text>
    </g>
    <g opacity='0.10'>
      <path d='M120 640 C 280 540, 520 540, 720 640 C 900 730, 1040 730, 1100 660' stroke='white' stroke-width='44' fill='none' stroke-linecap='round'/>
      <path d='M160 700 C 320 600, 560 600, 760 700 C 940 790, 1060 790, 1120 720' stroke='white' stroke-width='34' fill='none' stroke-linecap='round'/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function bannerDataUrl() {
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='#2f6b3c'/>
        <stop offset='0.6' stop-color='#d08a4b'/>
        <stop offset='1' stop-color='#f2cfac'/>
      </linearGradient>
      <radialGradient id='r1' cx='30%' cy='30%' r='60%'>
        <stop offset='0' stop-color='rgba(255,255,255,0.35)'/>
        <stop offset='1' stop-color='rgba(255,255,255,0)'/>
      </radialGradient>
      <radialGradient id='r2' cx='70%' cy='65%' r='55%'>
        <stop offset='0' stop-color='rgba(255,255,255,0.25)'/>
        <stop offset='1' stop-color='rgba(255,255,255,0)'/>
      </radialGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <circle cx='320' cy='260' r='240' fill='url(#r1)'/>
    <circle cx='1100' cy='620' r='300' fill='url(#r2)'/>
    <g opacity='0.12'>
      <path d='M120 680 C 320 560, 560 560, 760 680 C 940 780, 1080 780, 1180 700' stroke='white' stroke-width='44' fill='none' stroke-linecap='round'/>
      <path d='M180 740 C 360 620, 620 620, 820 740 C 980 820, 1140 820, 1240 760' stroke='white' stroke-width='34' fill='none' stroke-linecap='round'/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolveBannerUrl(value: string, origin: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
}

function parseOrigin(raw?: string | null) {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function parsePopularIds(raw?: string | null) {
  if (!raw) return [] as string[];
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map((id) => String(id).trim()).filter(Boolean);
    }
  } catch {
    // ignore invalid JSON
  }
  return [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

/**
 * ✅ PRODUCTION-SAFE ORIGIN:
 * - request headers -> (x-forwarded-host/proto)
 * - canonicalize to SITE_URL host (so bots with random Host won't break your internal calls)
 * - never returns localhost/127.*
 */
async function getCanonicalOrigin(): Promise<string> {
  const h = await headers();

  const xfHostRaw = h.get("x-forwarded-host");
  const hostRaw = (xfHostRaw || h.get("host") || "").split(",")[0].trim();

  const xfProtoRaw = h.get("x-forwarded-proto");
  const protoRaw = (xfProtoRaw || "https").split(",")[0].trim();

  // Canonical origin from env (safe-validated)
  const envSite = parseOrigin(process.env.SITE_URL);
  const envSiteHost = envSite ? new URL(envSite).host : null;

  // If Host header looks suspicious or localhost-ish -> force canonical SITE_URL (if available)
  const hostLower = hostRaw.toLowerCase();
  const isLocalHost =
    hostLower.includes("localhost") ||
    hostLower.startsWith("127.") ||
    hostLower.startsWith("0.0.0.0");

  const isWeirdHost = !hostRaw || isLocalHost;

  // If request came with random host (bots scanning other vhosts), also force canonical
  const notCanonical = envSiteHost ? hostRaw && hostRaw !== envSiteHost && hostRaw !== `www.${envSiteHost}` : false;

  if (envSite && (isWeirdHost || notCanonical)) {
    return envSite;
  }

  // If host header is valid and not localhost -> use it
  if (hostRaw && !isLocalHost) {
    const proto = protoRaw === "http" || protoRaw === "https" ? protoRaw : "https";
    return `${proto}://${hostRaw}`;
  }

  // Final fallback: use env SITE_URL if exists, otherwise hard fallback
  return envSite || "https://wasabisushi.uz";
}

async function getUploadsOrigin(origin: string | Promise<string>): Promise<string> {
  const resolvedOrigin = await origin;
  // if you later add UPLOADS_ORIGIN, it must be a real https domain; localhost will be ignored.
  const envUploads =
    parseOrigin(process.env.NEXT_PUBLIC_UPLOADS_ORIGIN) ??
    parseOrigin(process.env.UPLOADS_ORIGIN);

  if (envUploads) {
    const hostLower = new URL(envUploads).host.toLowerCase();
    const isLocal =
      hostLower.includes("localhost") ||
      hostLower.startsWith("127.") ||
      hostLower.startsWith("0.0.0.0");
    if (!isLocal) return envUploads;
  }

  return resolvedOrigin;
}

function getPosterOrigin() {
  const base = process.env.POSTER_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

async function getSeoMeta(locale: Locale) {
  const row = await prisma.seoMeta.findUnique({
    where: { page_locale: { page: "home", locale } },
  });

  const fallback = COPY[locale];
  return {
    title: row?.title || fallback.seoTitle,
    description: row?.description || fallback.seoDescription,
    keywords: row?.keywords || fallback.seoKeywords,
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

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string }> | { q?: string };
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const copy = COPY[locale];
  const sp = searchParams ? await Promise.resolve(searchParams) : {};
  const query = (sp?.q ?? "").trim().toLowerCase();

  const origin = await getCanonicalOrigin();       // ✅ fixed
  const uploadsOrigin = await getUploadsOrigin(origin);
  const posterOrigin = getPosterOrigin() ?? origin;

  const [categoryRows, productRows, popularRow] = await Promise.all([
    prisma.categoryTranslation.findMany({
      select: { categoryId: true, nameUz: true, sortOrder: true },
    }),
    prisma.productTranslation.findMany({
      select: { productId: true, nameUz: true, sortOrder: true },
    }),
    prisma.botSetting.findUnique({ where: { key: "popular_products" } }),
  ]);

  const categoryNameUzMap = new Map(
    categoryRows
      .map((row) => [String(row.categoryId ?? "").trim(), String(row.nameUz ?? "").trim()] as const)
      .filter(([id, name]) => id && name)
  );
  const categorySortMap = new Map(
    categoryRows.map((row) => [String(row.categoryId ?? "").trim(), row.sortOrder ?? null] as const)
  );

  const productNameUzMap = new Map(
    productRows
      .map((row) => [String(row.productId ?? "").trim(), String(row.nameUz ?? "").trim()] as const)
      .filter(([id, name]) => id && name)
  );
  const productSortMap = new Map(
    productRows.map((row) => [String(row.productId ?? "").trim(), row.sortOrder ?? null] as const)
  );

  const popularIds = parsePopularIds(popularRow?.value);
  const currency = locale === "uz" ? "so'm" : "сум";

  const bannersPromise: Promise<Banner[]> = (async () => {
    try {
      const where: any = { active: true };
      if (locale === "ru" || locale === "uz") {
        where.OR = [{ locale }, { locale: "all" }];
      }
      const rows = await prisma.banner.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });
      if (!rows.length) throw new Error("empty");
      return rows.map((b) => ({
        id: String(b.id),
        image: resolveBannerUrl(b.imageUrl, uploadsOrigin),
        href: b.href || `/${locale}#products`,
      }));
    } catch {
      return [
        {
          id: "promo-1",
          image: bannerDataUrl(),
          href: `/${locale}#products`,
        },
      ];
    }
  })();

  const topProductsFallback: ProductCard[] =
    locale === "uz"
      ? [
          { id: "p1", title: "Losos maki", price: "29 000 so'm", image: svgDataUrl("Maki") },
          { id: "p2", title: "Filadelfiya 4 dona", price: "35 000 so'm", image: svgDataUrl("Philadelphia") },
          { id: "p3", title: "Avokado roll", price: "27 000 so'm", image: svgDataUrl("Avocado") },
          { id: "p4", title: "Tempura miks", price: "32 000 so'm", image: svgDataUrl("Tempura") },
          { id: "p5", title: "Tovuq seti", price: "58 000 so'm", image: svgDataUrl("Set") },
          { id: "p6", title: "Issiq ramen", price: "41 000 so'm", image: svgDataUrl("Ramen") },
        ]
      : [
          { id: "p1", title: "Суши с лососем", price: "29 000 сум", image: svgDataUrl("Лосось") },
          { id: "p2", title: "Филадельфия 4 шт", price: "35 000 сум", image: svgDataUrl("Филадельфия") },
          { id: "p3", title: "Авокадо ролл", price: "27 000 сум", image: svgDataUrl("Авокадо") },
          { id: "p4", title: "Темпура микс", price: "32 000 сум", image: svgDataUrl("Темпура") },
          { id: "p5", title: "Сет с курицей", price: "58 000 сум", image: svgDataUrl("Сет") },
          { id: "p6", title: "Горячий рамэн", price: "41 000 сум", image: svgDataUrl("Рамэн") },
        ];

  const topProductsPromise: Promise<ProductCard[]> = (async () => {
    try {
      const res = await fetch(`${origin}/api/poster/products`, { cache: "no-store" });
      if (!res.ok) throw new Error("products");
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty");

      const mapped = rows.map((p: any, idx: number) => {
        const id = String(p.product_id ?? p.id ?? idx).trim();
        const rawName = String(p.product_name ?? p.name ?? "").trim();
        const cleanName = rawName.includes("$") ? rawName.split("$")[0].trim() : rawName;
        const translated = locale === "uz" && id ? productNameUzMap.get(id) : null;
        const title =
          translated && translated.trim()
            ? translated.trim()
            : cleanName || (locale === "uz" ? "Taom" : "Товар");

        const priceNum = Number(p.price ?? 0);
        const price = `${(priceNum / 100).toLocaleString()} ${currency}`;

        const imgRaw = String(p.photo_origin ?? p.photo ?? p.image ?? "").trim();
        const img =
          imgRaw && imgRaw.startsWith("/") ? `${posterOrigin}${imgRaw}` : imgRaw || svgDataUrl(title);

        const categoryId = String(p.category_id ?? p.categoryId ?? "").trim() || null;
        const categoryTitle =
          (locale === "uz" && categoryId ? categoryNameUzMap.get(categoryId) : null) ||
          String(p.category_name ?? p.categoryName ?? "").trim() ||
          undefined;

        return {
          id,
          title,
          price,
          image: img,
          href: `/${locale}/menu/${encodeURIComponent(id)}`,
          categoryId,
          categoryTitle,
        };
      });

      return mapped.length ? mapped : topProductsFallback;
    } catch {
      return topProductsFallback;
    }
  })();

  const categoryListPromise: Promise<{ id: string; title: string }[]> = (async () => {
    try {
      const res = await fetch(`${origin}/api/poster/categories`, { cache: "no-store" });
      if (!res.ok) throw new Error("categories");
      const json = await res.json();
      const arr =
        (Array.isArray((json as any)?.categories) && (json as any).categories) ||
        (Array.isArray((json as any)?.response) && (json as any).response) ||
        (Array.isArray((json as any)?.data) && (json as any).data) ||
        (Array.isArray((json as any)?.result) && (json as any).result) ||
        (Array.isArray((json as any)?.categories?.items) && (json as any).categories.items) ||
        (Array.isArray((json as any)?.response?.items) && (json as any).response.items) ||
        (Array.isArray(json) && json) ||
        [];
      if (!arr.length) return [];
      const normalize = (v: any) => (typeof v === "string" ? v.trim() : "");
      const list = arr
        .map((c: any) => {
          const id = normalize(c?.category_id ?? c?.categoryId ?? c?.id ?? "");
          const title =
            (locale === "uz" && id ? categoryNameUzMap.get(id) : null) ||
            normalize(c?.category_name ?? c?.name ?? c?.title ?? "");
          return id && title ? { id, title } : null;
        })
        .filter(Boolean) as { id: string; title: string }[];

      const ordered = list
        .map((item, idx) => ({
          ...item,
          index: idx,
          sortOrder: categorySortMap.get(item.id) ?? null,
        }))
        .sort((a, b) => {
          const aHas = a.sortOrder !== null && a.sortOrder !== undefined;
          const bHas = b.sortOrder !== null && b.sortOrder !== undefined;
          if (aHas && bHas) return a.sortOrder - b.sortOrder || a.index - b.index;
          if (aHas) return -1;
          if (bHas) return 1;
          return a.index - b.index;
        })
        .map(({ id, title }) => ({ id, title }));

      return ordered;
    } catch {
      return [];
    }
  })();

  const [banners, topProducts, categoryList] = await Promise.all([
    bannersPromise,
    topProductsPromise,
    categoryListPromise,
  ]);

  const filteredProducts = query
    ? topProducts.filter((p) => p.title.toLowerCase().includes(query))
    : topProducts;

  const byId = new Map(filteredProducts.map((p) => [p.id, p]));
  const popularSet = new Set(popularIds);
  const popularProducts: ProductCard[] = [];
  for (const id of popularIds) {
    const item = byId.get(id);
    if (item) popularProducts.push(item);
  }
  if (popularProducts.length < 10) {
    for (const item of filteredProducts) {
      if (popularProducts.length >= 10) break;
      if (popularSet.has(item.id)) continue;
      popularProducts.push(item);
    }
  }
  const popularIdsFinal = new Set(popularProducts.map((p) => p.id));
  const catalogProducts = filteredProducts.filter((p) => !popularIdsFinal.has(p.id));
  const categoryTitleMap = new Map(categoryList.map((c) => [c.id, c.title]));
  const grouped = new Map<string, ProductCard[]>();
  for (const item of catalogProducts) {
    const categoryTitle =
      item.categoryTitle ||
      (item.categoryId ? categoryTitleMap.get(item.categoryId) : null) ||
      (locale === "uz" ? "Boshqa" : "Другое");
    const list = grouped.get(categoryTitle) || [];
    list.push(item);
    grouped.set(categoryTitle, list);
  }
  const productIndex = new Map(catalogProducts.map((item, idx) => [item.id, idx] as const));
  const getProductOrder = (item: ProductCard) => {
    const order = productSortMap.get(item.id);
    return typeof order === "number" ? order : null;
  };
  const getProductIndex = (item: ProductCard) => productIndex.get(item.id) ?? 0;
  for (const list of grouped.values()) {
    list.sort((a, b) => {
      const aOrder = getProductOrder(a);
      const bOrder = getProductOrder(b);
      const aHas = aOrder !== null && aOrder !== undefined;
      const bHas = bOrder !== null && bOrder !== undefined;
      if (aHas && bHas) return aOrder - bOrder || getProductIndex(a) - getProductIndex(b);
      if (aHas) return -1;
      if (bHas) return 1;
      return getProductIndex(a) - getProductIndex(b);
    });
  }
  const orderedGroups = [
    ...categoryList
      .map((c) => c.title)
      .filter((title) => grouped.has(title))
      .map((title) => [title, grouped.get(title) || []] as const),
    ...[...grouped.entries()].filter(([title]) => !categoryList.some((c) => c.title === title)),
  ];
  const categoryNav = orderedGroups.map(([title]) => ({
    title,
    id: `cat-${slugify(title)}`,
  }));

  const reviews: ReviewCard[] = await (async () => {
    const formatDate = (value: string) => {
      try {
        return new Date(value).toLocaleDateString(locale === "uz" ? "uz-UZ" : "ru-RU");
      } catch {
        return value;
      }
    };

    try {
      const res = await fetch(`${origin}/api/reviews?locale=${locale}&limit=6`, { cache: "no-store" });
      if (!res.ok) throw new Error("reviews");
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty");

      return rows.map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        title:
          String(r.title ?? "").trim() ||
          (locale === "uz" ? "Mijozlar fikri" : "Отзывы покупателей"),
        text: String(r.text ?? "").trim() || "",
        authorName: String(r.authorName ?? "").trim() || (locale === "uz" ? "Mehmon" : "Гость"),
        authorRole: String(r.authorRole ?? "").trim() || "",
        rating: Number(r.rating ?? 5),
        photo: r.photoUrl || svgDataUrl("Отзыв"),
        date: r.publishedAt ? formatDate(String(r.publishedAt)) : "",
      }));
    } catch {
      const today = new Date().toLocaleDateString(locale === "uz" ? "uz-UZ" : "ru-RU");
      return [
        {
          id: "review-1",
          title: locale === "uz" ? "Eng yaxshi rollar" : "Лучшие роллы в Ташкенте",
          text:
            locale === "uz"
              ? "Wasabi'da ta'm va servis juda yoqdi. Albatta tavsiya qilaman."
              : "Заказали роллы — очень свежо и вкусно, обязательно рекомендую.",
          authorName: locale === "uz" ? "Madina" : "Анна",
          authorRole: locale === "uz" ? "Toshkent" : "Ташкент",
          rating: 5,
          photo: svgDataUrl("Отзыв"),
          date: today,
        },
      ];
    }
  })();

  const revealDelay = (idx: number) => {
    const classes = [
      "",
      "site-reveal--delay-1",
      "site-reveal--delay-2",
      "site-reveal--delay-3",
      "site-reveal--delay-4",
    ];
    return classes[idx % classes.length];
  };

  return (
    <div className="ws-page">
      <Header locale={locale} />

      <main className="site-main">
        <section className="site-hero">
          <div className="ws-container">
            <div className="site-hero__card site-hero__card--banner">
              <BannerCarousel banners={banners} />
            </div>
          </div>
        </section>

        <section className="site-section" aria-label={copy.productsTitle} id="products">
          <div className="ws-container">
            <div className="site-section__head">
              <div>
                <p className="site-eyebrow">{copy.productsTitle}</p>
                <h2 className="site-title">{copy.productsTitle}</h2>
                <p className="site-subtitle">{copy.productsSubtitle}</p>
              </div>
            </div>

            <div className="site-grid site-grid-4" role="list">
              {popularProducts.map((prod, idx) => {
                const content = (
                  <>
                    <div className="site-product-card__img">
                      <img src={prod.image} alt={prod.title} loading="lazy" decoding="async" />
                    </div>
                    <div className="site-product-card__title">{prod.title}</div>
                    <div className="site-product-card__price">{prod.price}</div>
                    <div className="site-product-card__actions">
                      <span className="site-button site-button--ghost">{copy.addToCart}</span>
                    </div>
                  </>
                );

                return prod.href ? (
                  <Link
                    key={prod.id}
                    href={prod.href}
                    className={`site-product-card site-reveal ${revealDelay(idx)}`}
                    role="listitem"
                    aria-label={prod.title}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={prod.id}
                    className={`site-product-card site-reveal ${revealDelay(idx)}`}
                    role="listitem"
                    aria-label={prod.title}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="site-section site-catalog" aria-label={copy.catalogTitle}>
          <div className="ws-container">
            <div className="site-section__head">
              <div>
                <p className="site-eyebrow">{copy.catalogTitle}</p>
                <h2 className="site-title">{copy.catalogTitle}</h2>
                <p className="site-subtitle">{copy.catalogSubtitle}</p>
              </div>
            </div>

            <div className="site-catalog__layout">
              <aside className="site-catalog__sidebar" aria-label={copy.catalogTitle}>
                <div className="site-catalog__nav">
                  {categoryNav.map((cat) => (
                    <a key={cat.id} href={`#${cat.id}`} className="site-catalog__link">
                      {cat.title}
                    </a>
                  ))}
                </div>
              </aside>

              <div className="site-catalog__content">
                {orderedGroups.map(([title, items]) => {
                  const anchorId = `cat-${slugify(title)}`;
                  return (
                    <div key={title} className="site-category-block">
                      <h3 id={anchorId} className="site-category-title">
                        {title}
                      </h3>
                      <div className="site-grid site-grid-4 site-grid-compact" role="list">
                        {items.map((prod, idx) => {
                          const content = (
                            <>
                              <div className="site-product-card__img">
                                <img src={prod.image} alt={prod.title} loading="lazy" decoding="async" />
                              </div>
                              <div className="site-product-card__title">{prod.title}</div>
                              <div className="site-product-card__price">{prod.price}</div>
                              <div className="site-product-card__actions">
                                <span className="site-button site-button--ghost">{copy.addToCart}</span>
                              </div>
                            </>
                          );

                          return prod.href ? (
                            <Link
                              key={prod.id}
                              href={prod.href}
                              className={`site-product-card site-reveal ${revealDelay(idx)}`}
                              role="listitem"
                              aria-label={prod.title}
                            >
                              {content}
                            </Link>
                          ) : (
                            <div
                              key={prod.id}
                              className={`site-product-card site-reveal ${revealDelay(idx)}`}
                              role="listitem"
                              aria-label={prod.title}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="site-section" aria-label={copy.reviewsTitle}>
          <div className="ws-container">
            <div className="site-section__head">
              <div>
                <p className="site-eyebrow">{copy.reviewsTitle}</p>
                <h2 className="site-title">{copy.reviewsTitle}</h2>
                <p className="site-subtitle">{copy.reviewsSubtitle}</p>
              </div>
            </div>

            <div className="site-reviewList" role="list">
              {reviews.map((review, idx) => (
                <article
                  key={review.id}
                  className={`site-reviewCard site-reveal ${revealDelay(idx)}`}
                  role="listitem"
                >
                  <div className="site-reviewCard__head">
                    <div className="site-reviewCard__photo">
                      <Image
                        src={review.photo}
                        alt={review.title}
                        fill
                        sizes="120px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div className="site-reviewCard__title">{review.title}</div>
                      <div className="site-reviewCard__meta">
                        <span>{review.authorName}</span>
                        {review.authorRole ? <span>• {review.authorRole}</span> : null}
                        {review.date ? <span>• {review.date}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="site-reviewCard__text">
                    “{review.text || (locale === "uz" ? "Juda yoqdi." : "Очень понравилось.")}”
                  </div>
                  <div className="site-reviewCard__meta">
                    ⭐ {review.rating.toFixed(1)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="site-section" aria-label={copy.ctaTitle}>
          <div className="ws-container">
            <div className="site-cta">
              <div className="site-cta__row">
                <div>
                  <h2 className="site-title">{copy.ctaTitle}</h2>
                  <p className="site-subtitle">{copy.ctaText}</p>
                </div>
                <Link className="site-button site-button--primary" href={`/${locale}#products`}>
                  {copy.ctaButton}
                </Link>
              </div>
              <div className="site-divider" />
              <div className="site-subtitle">
                {locale === "uz"
                  ? "Sizning buyurtmangizni 2 daqiqada qabul qilamiz va sizga yetkazamiz."
                  : "Примем заказ за 2 минуты и доставим, пока вы выбираете напиток."}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
