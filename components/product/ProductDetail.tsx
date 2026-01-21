"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { addToCart } from "@/lib/cart/cart";
import { t } from "@/lib/i18n/t";

type PromoEntry = {
  discount_value: number;
  result_type: number;
  promotion_id: number | null;
  discount_prices?: any[];
  is_bonus?: boolean;
};

type ProductDetailData = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  description?: string | null;
  ingredients?: string | null;
  categoryName?: string | null;
};

const COPY = {
  ru: {
    back: "Вернуться на главную",
    ingredients: "Состав",
    description: "Описание",
    badge: "Скидка",
    gift: "Подарок",
    added: "добавлено в корзину",
  },
  uz: {
    back: "Bosh sahifaga qaytish",
    ingredients: "Tarkibi",
    description: "Tavsif",
    badge: "Chegirma",
    gift: "Sovg'a",
    added: "savatga qo'shildi",
  },
};

function calcPromoPrice(price: number, promo?: PromoEntry | null) {
  if (!promo) return null;
  if (promo.is_bonus) return 0;
  let byValue: number | null = null;
  if (promo.discount_value > 0) {
    if (promo.result_type === 3) {
      byValue = Math.max(0, Math.round(price * (1 - promo.discount_value / 100)));
    } else if (promo.result_type === 1) {
      byValue = Math.max(0, Math.round(price - promo.discount_value));
    }
  }
  const byList = extractDiscountPrice(promo.discount_prices);
  if (byList !== null && byList > 0) {
    if (byValue === null) return byList;
    return Math.min(byValue, byList);
  }
  return byValue;
}

function parsePrice(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value
      .replace(/\s+/g, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const n = parsePrice(item);
      if (n && n > 0) return n;
    }
    return null;
  }
  if (typeof value === "object") {
    const maybe = [
      (value as any).price_value,
      (value as any).price,
      (value as any).value,
      (value as any).sum,
      (value as any).amount,
      (value as any).price_1,
      (value as any).price1,
      (value as any)["1"],
    ];
    for (const v of maybe) {
      const n = parsePrice(v);
      if (n && n > 0) return n;
    }
    for (const v of Object.values(value)) {
      const n = parsePrice(v);
      if (n && n > 0) return n;
    }
  }
  return null;
}

function extractDiscountPrice(discountPrices?: any[]) {
  if (!Array.isArray(discountPrices) || discountPrices.length === 0) return null;
  const primary: number[] = [];
  const fallback: number[] = [];
  for (const entry of discountPrices) {
    const n = parsePrice(entry);
    if (!n || n <= 0) continue;
    const priceId =
      typeof entry === "object" && entry
        ? String((entry as any).price_id ?? (entry as any).priceId ?? "")
        : "";
    if (priceId === "1") {
      primary.push(Math.round(n));
    } else {
      fallback.push(Math.round(n));
    }
  }
  const list = primary.length ? primary : fallback;
  if (!list.length) return null;
  return Math.min(...list);
}

export default function ProductDetail({
  locale,
  product,
}: {
  locale: Locale;
  product: ProductDetailData;
}) {
  const copy = locale === "uz" ? COPY.uz : COPY.ru;
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [promo, setPromo] = useState<PromoEntry | null>(null);

  useEffect(() => {
    fetch("/api/poster/promotions")
      .then((r) => r.json())
      .then((data) => {
        const entry = data?.discounts?.[product.id];
        setPromo(entry || null);
      })
      .catch(() => setPromo(null));
  }, [product.id]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const promoPrice = useMemo(() => calcPromoPrice(product.price, promo), [product.price, promo]);
  const showPromo = promo?.is_bonus || (promoPrice !== null && promoPrice < product.price);
  const finalPrice = showPromo && promoPrice !== null ? promoPrice : product.price;

  const currency = locale === "uz" ? "so'm" : "сум";

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const badgeLabel = promo?.is_bonus ? copy.gift : copy.badge;
  const badgeClass = promo?.is_bonus
    ? "product-detail__badge"
    : "product-detail__badge product-detail__badge--discount";

  return (
    <div className="product-detail">
      <div className="product-detail__media">
        {showPromo ? <div className={badgeClass}>{badgeLabel}</div> : null}
        <img
          src={product.image || "/icons/logo.png"}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="product-detail__info">
        <Link className="product-detail__back" href={`/${locale}`}>
          ← {copy.back}
        </Link>
        {product.categoryName ? (
          <div className="product-detail__category">{product.categoryName}</div>
        ) : null}
        <h1 className="product-detail__title">{product.name}</h1>

        <div className="product-detail__price">
          {showPromo && promoPrice !== null ? (
            <div className="site-price">
              <span className="site-price__old">
                {(product.price / 100).toLocaleString()} {currency}
              </span>
              <span className="site-price__new">
                {(promoPrice / 100).toLocaleString()} {currency}
              </span>
            </div>
          ) : (
            <span>
              {(product.price / 100).toLocaleString()} {currency}
            </span>
          )}
        </div>

        {product.description ? (
          <div className="product-detail__section">
            <div className="product-detail__label">{copy.description}</div>
            <p className="product-detail__text">{product.description}</p>
          </div>
        ) : null}

        <div className="product-detail__actions">
          <div className="site-qty">
            <button
              className="site-qty__btn"
              type="button"
              onClick={() => setQty((v) => Math.max(1, v - 1))}
              aria-label={locale === "uz" ? "Kamaytirish" : "Уменьшить"}
            >
              −
            </button>
            <div className="site-qty__val">{qty}</div>
            <button
              className="site-qty__btn"
              type="button"
              onClick={() => setQty((v) => v + 1)}
              aria-label={locale === "uz" ? "Oshirish" : "Увеличить"}
            >
              +
            </button>
          </div>
          <button
            className="site-button site-button--primary"
            type="button"
            onClick={() => {
              addToCart(
                {
                  product_id: product.id,
                  name: product.name,
                  price: finalPrice,
                  image: product.image || undefined,
                },
                qty
              );
              showToast(`${product.name} × ${qty} ${copy.added}`);
            }}
          >
            {t(locale, "common.add")}
          </button>
        </div>
      </div>

      {toast && (
        <div className="site-toast" role="status" aria-live="polite">
          <div className="site-toast__body">{toast}</div>
        </div>
      )}
    </div>
  );
}
