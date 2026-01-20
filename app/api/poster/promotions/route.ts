import { NextResponse } from "next/server";
import { posterFetch } from "@/lib/poster/posterClient";
import { cached } from "@/lib/poster/posterCache";
import { mapPosterProducts } from "@/lib/poster/posterMapper";

export const dynamic = "force-dynamic";

type PosterPromotion = {
  auto_apply?: string | number;
  name?: string;
  date_start?: string | null;
  date_end?: string | null;
  params?: {
    discount_value?: string | number;
    result_type?: string | number;
    periods?: Array<{ start: string; end: string }>;
    conditions?: Array<{ type?: string | number; id?: string | number }>;
    discount_prices?: any[];
    bonus_products?: Array<{ id?: string | number }>;
  };
  promotion_id?: string | number;
};

type PromoEntry = {
  discount_value: number;
  result_type: number;
  promotion_id: number | null;
  discount_prices?: any[];
  is_bonus?: boolean;
};

function parseUtc(value?: string | null) {
  if (!value) return null;
  if (value === "0000-00-00 00:00:00") return null;
  const iso = value.replace(" ", "T");
  const date = new Date(`${iso}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTashkentMinutes() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function parseMinutes(value?: string) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return Math.min(23, Math.max(0, hour)) * 60 + Math.min(59, Math.max(0, minute));
}

function isWithinPeriods(periods: Array<{ start: string; end: string }> | undefined, nowMinutes: number) {
  if (!periods || periods.length === 0) return true;
  for (const period of periods) {
    const start = parseMinutes(period?.start);
    const end = parseMinutes(period?.end);
    if (start === null || end === null) continue;
    if (start <= end) {
      if (nowMinutes >= start && nowMinutes <= end) return true;
    } else {
      if (nowMinutes >= start || nowMinutes <= end) return true;
    }
  }
  return false;
}

function isActivePromotion(promo: PosterPromotion, now: Date, nowMinutes: number) {
  const autoApply = String(promo?.auto_apply ?? "") === "1";
  if (!autoApply) return false;

  const start = parseUtc(promo?.date_start);
  const end = parseUtc(promo?.date_end);
  if (start && now < start) return false;
  if (end && now > end) return false;

  const periods = promo?.params?.periods;
  if (!isWithinPeriods(periods, nowMinutes)) return false;

  return true;
}

function normalizeDiscountPrices(raw: any) {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    const values = Object.values(raw);
    return values.length ? values : undefined;
  }
  return undefined;
}

function pickDiscountPrices(raw: any, productId?: string) {
  const list = normalizeDiscountPrices(raw);
  if (!list || list.length === 0) return undefined;
  if (!productId) return list;
  const withProduct = list.filter((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const pid = String((entry as any).product_id ?? (entry as any).productId ?? "").trim();
    return pid ? pid === productId : false;
  });
  return withProduct.length ? withProduct : list;
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

export async function GET() {
  const now = new Date();
  const nowMinutes = getTashkentMinutes();

  const [promotionsRaw, products] = await Promise.all([
    cached("poster:promotions", 60_000, () =>
      posterFetch<{ response?: PosterPromotion[] }>("clients.getPromotions")
    ),
    cached("poster:products:all", 60_000, () => getAllProducts()),
  ]);

  const promoList = Array.isArray(promotionsRaw?.response)
    ? promotionsRaw.response
    : promotionsRaw?.response
    ? [promotionsRaw.response]
    : [];

  const productCategories: Record<string, string[]> = {};
  products.forEach((p: any) => {
    const pid = String(p.product_id ?? p.id ?? "").trim();
    const cat = String(p.category_id ?? "").trim();
    if (!pid || !cat) return;
    if (!productCategories[cat]) productCategories[cat] = [];
    productCategories[cat].push(pid);
  });

  const discounts: Record<string, PromoEntry> = {};

  promoList.forEach((promo) => {
    if (!isActivePromotion(promo, now, nowMinutes)) return;
    const discountValue = Number(promo?.params?.discount_value ?? 0) || 0;
    const resultType = Number(promo?.params?.result_type ?? 0) || 0;
    const promotionIdRaw = promo?.promotion_id;
    const promotionId =
      promotionIdRaw !== undefined && promotionIdRaw !== null && String(promotionIdRaw).trim()
        ? Number(promotionIdRaw)
        : null;
    const discountPricesRaw = promo?.params?.discount_prices;

    const conditions = Array.isArray(promo?.params?.conditions) ? promo.params.conditions : [];
    conditions.forEach((condition) => {
      const entityType = Number(condition?.type ?? 0);
      const entityId = String(condition?.id ?? "").trim();
      if (!entityId) return;
      const discountPrices = pickDiscountPrices(discountPricesRaw, entityId);
      if (discountValue <= 0 && (!discountPrices || discountPrices.length === 0)) return;

      if (entityType === 2) {
        discounts[entityId] = {
          discount_value: discountValue,
          result_type: resultType,
          promotion_id: promotionId,
          discount_prices: discountPrices,
        };
      } else if (entityType === 1) {
        const productsForCat = productCategories[entityId] || [];
        productsForCat.forEach((pid) => {
          const pricesForProduct = pickDiscountPrices(discountPricesRaw, pid);
          if (discountValue <= 0 && (!pricesForProduct || pricesForProduct.length === 0)) return;
          discounts[pid] = {
            discount_value: discountValue,
            result_type: resultType,
            promotion_id: promotionId,
            discount_prices: pricesForProduct,
          };
        });
      }
    });

    const bonusList = Array.isArray(promo?.params?.bonus_products)
      ? promo.params.bonus_products
      : [];
    bonusList.forEach((bonus) => {
      const bonusId = String(bonus?.id ?? "").trim();
      if (!bonusId) return;
      discounts[bonusId] = {
        discount_value: 100,
        result_type: 1,
        promotion_id: promotionId,
        is_bonus: true,
      };
    });
  });

  return NextResponse.json({ discounts, updatedAt: new Date().toISOString() });
}
