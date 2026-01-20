import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";
import { posterFetch } from "@/lib/poster/posterClient";
import { mapPosterProducts } from "@/lib/poster/posterMapper";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/product/ProductDetail";

function extractName(value: any) {
  if (!value || typeof value !== "object") return "";
  const candidates = [
    value.name,
    value.product_name,
    value.ingredient_name,
    value.item_name,
    value.title,
    value.caption,
  ];
  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function extractQty(value: any) {
  if (!value || typeof value !== "object") return null;
  const raw = value.count ?? value.qty ?? value.quantity ?? value.amount;
  if (raw === undefined || raw === null) return null;
  const num = Number(String(raw).replace(",", "."));
  if (Number.isFinite(num) && num > 1) return num;
  return null;
}

function formatPosterText(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => formatPosterText(item)).filter(Boolean);
    return parts.join(", ");
  }
  if (typeof value === "object") {
    const name = extractName(value);
    if (name) {
      const qty = extractQty(value);
      return qty ? `${name} × ${qty}` : name;
    }
    const nested =
      value.product ??
      value.ingredient ??
      value.item ??
      value.items ??
      value.products ??
      value.ingredients ??
      value.value;
    const nestedText = formatPosterText(nested);
    if (nestedText) return nestedText;
    const entries = Object.entries(value as Record<string, unknown>);
    const parts = entries
      .filter((entry): entry is [string, string] => {
        const [, v] = entry;
        return typeof v === "string" && v.trim().length > 0;
      })
      .filter(([k]) => !["id", "product_id", "ingredient_id"].includes(k))
      .map(([, v]) => v.trim());
    return parts.join(" ");
  }
  return "";
}

function cleanText(value?: any) {
  if (!value) return "";
  return formatPosterText(value).replace(/\s+/g, " ").trim();
}

function truncate(value: string, length = 160) {
  if (value.length <= length) return value;
  return value.slice(0, Math.max(0, length - 1)).trimEnd() + "…";
}

async function getAllProducts() {
  const raw = await posterFetch<any>("menu.getProducts");
  let mapped = mapPosterProducts(raw);

  if (mapped.length === 0) {
    const catsRaw = await posterFetch<any>("menu.getCategories");
    const cats =
      (Array.isArray(catsRaw?.response) && catsRaw.response) ||
      (Array.isArray(catsRaw?.categories) && catsRaw.categories) ||
      [];
    const ids = cats
      .map((c: any) => String(c?.category_id ?? c?.id ?? "").trim())
      .filter(Boolean);
    const perCat = await Promise.all(
      ids.map((id: string) =>
        posterFetch<any>("menu.getProducts", { category_id: id }).catch(() => null)
      )
    );
    mapped = perCat.flatMap((res, idx) => {
      if (!res) return [];
      const list = mapPosterProducts(res);
      if (!list.length) return [];
      const catId = ids[idx];
      return list.map((p: any) => (p.category_id ? p : { ...p, category_id: catId }));
    });
  }

  return mapped;
}

async function getProductById(id: string) {
  const trimmed = id.trim();
  if (!trimmed) return null;

  try {
    const raw = await posterFetch<any>("menu.getProducts", { product_id: trimmed });
    const list = mapPosterProducts(raw);
    const found = list.find((p: any) => String(p.product_id ?? p.id ?? "") === trimmed);
    if (found) return found;
  } catch {
    // ignore
  }

  const all = await getAllProducts();
  return all.find((p: any) => String(p.product_id ?? p.id ?? "") === trimmed) || null;
}

async function getCategoryName(categoryId: string | null, locale: Locale) {
  if (!categoryId) return null;
  if (locale !== "uz") return null;
  const row = await prisma.categoryTranslation.findUnique({
    where: { categoryId },
    select: { nameUz: true },
  });
  return row?.nameUz || null;
}

async function getProductTranslation(productId: string) {
  return prisma.productTranslation.findUnique({
    where: { productId },
  });
}

async function getProductPageData(locale: Locale, id: string) {
  const product = await getProductById(id);
  if (!product) return null;
  const productId = String(product.product_id || id);
  const translation = await getProductTranslation(productId);
  const categoryName =
    locale === "uz"
      ? (await getCategoryName(String(product.category_id ?? ""), locale)) ||
        product.category_name ||
        null
      : product.category_name || null;

  const name =
    locale === "uz" && translation?.nameUz
      ? translation.nameUz
      : product.product_name || "";
  const description =
    locale === "uz" && translation?.descUz
      ? translation.descUz
      : product.description || "";

  return {
    product: {
      id: productId,
      name: name || "",
      price: Number(product.price ?? 0),
      image: product.photo_origin || product.photo || product.photo_raw || null,
      description: cleanText(description) || null,
      ingredients: cleanText(product.ingredients) || null,
      categoryName: cleanText(categoryName) || null,
    },
    translation,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const data = await getProductPageData(locale, p.id);
  if (!data) return { title: "Wasabi" };

  const { product, translation } = data;
  const seoTitle =
    locale === "uz" ? translation?.seoTitleUz || "" : translation?.seoTitleRu || "";
  const seoDesc =
    locale === "uz" ? translation?.seoDescUz || "" : translation?.seoDescRu || "";
  const seoKeywords =
    locale === "uz" ? translation?.seoKeywordsUz || "" : translation?.seoKeywordsRu || "";

  const title = seoTitle || product.name || "Wasabi";
  const description = truncate(seoDesc || product.description || product.ingredients || "");

  return {
    title,
    description,
    keywords: seoKeywords || undefined,
    openGraph: {
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const data = await getProductPageData(locale, p.id);
  if (!data) return notFound();

  return (
    <div className="ws-page">
      <Header locale={locale} />
      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <ProductDetail locale={locale} product={data.product} />
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
