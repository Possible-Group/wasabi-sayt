"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/t";
import {
  getCart,
  setCart,
  updateQty,
  clearCart,
  type CartItem,
  PACKAGE_ITEM_ID,
  CHOPSTICKS_ITEM_ID,
  isPackageItem,
  isChopsticksItem,
  isExtraItem,
  getItemsSubtotal,
  getPackageTotal,
  getPackageOptOut,
  setPackageOptOut,
  clearPackageOptOut,
  getChopsticksOptOut,
  setChopsticksOptOut,
  clearChopsticksOptOut,
} from "@/lib/cart/cart";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useParams } from "next/navigation";

export default function CartPage() {
  const routeParams = useParams();
  const rawLocale = Array.isArray(routeParams?.locale)
    ? routeParams.locale[0]
    : routeParams?.locale;
  const localeParam = typeof rawLocale === "string" ? rawLocale : "";
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const [items, setItems] = useState<CartItem[]>([]);
  const [fees, setFees] = useState<{ delivery: number; pack: number }>({ delivery: 0, pack: 0 });

  useEffect(() => setItems(getCart()), []);
  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((meta) => {
        setFees({
          delivery: Number(meta?.settings?.delivery_fee ?? 0),
          pack: Number(meta?.settings?.package_fee ?? 0),
        });
      })
      .catch(() => setFees({ delivery: 0, pack: 0 }));
  }, []);

  const packageLabel = locale === "uz" ? "Paket" : "Пакет";
  const chopsticksLabel = locale === "uz" ? "Tayoqchalar" : "Палочки";
  const packagePriceT = Math.round(fees.pack * 100);
  const chopsticksPriceT = 0;
  const packageItem = items.find(isPackageItem) || null;
  const chopsticksItem = items.find(isChopsticksItem) || null;
  const productItems = items.filter((it) => !isExtraItem(it));
  const hasProducts = productItems.length > 0;
  const itemsSubtotalT = getItemsSubtotal(items);
  const packageTotalT = getPackageTotal(items);
  const subtotalSum = itemsSubtotalT / 100;
  const packageSum = packageTotalT / 100;
  const totalSum = subtotalSum + packageSum + fees.delivery;
  const currency = locale === "uz" ? "so'm" : "сум";

  useEffect(() => {
    if (typeof window === "undefined") return;
    let next = items.slice();
    let changed = false;

    const hasRealProducts = next.some((it) => !isExtraItem(it));
    const allowPackage = hasRealProducts && fees.pack > 0;
    const allowChopsticks = hasRealProducts;

    if (!allowPackage && next.some(isPackageItem)) {
      next = next.filter((it) => !isPackageItem(it));
      clearPackageOptOut();
      changed = true;
    }

    if (!allowChopsticks && next.some(isChopsticksItem)) {
      next = next.filter((it) => !isChopsticksItem(it));
      clearChopsticksOptOut();
      changed = true;
    }

    if (allowPackage) {
      if (next.some(isPackageItem)) {
        const updated = next.map((it) =>
          isPackageItem(it)
            ? it.price === packagePriceT && it.name === packageLabel && it.qty === 1
              ? it
              : { ...it, price: packagePriceT, name: packageLabel, qty: 1 }
            : it
        );
        if (updated.some((it, idx) => it !== next[idx])) {
          next = updated;
          changed = true;
        }
      } else if (!getPackageOptOut()) {
        next = [...next, { product_id: PACKAGE_ITEM_ID, name: packageLabel, price: packagePriceT, qty: 1 }];
        changed = true;
      }
    }

    if (allowChopsticks) {
      if (next.some(isChopsticksItem)) {
        const updated = next.map((it) =>
          isChopsticksItem(it)
            ? it.price === chopsticksPriceT && it.name === chopsticksLabel && it.qty === 1
              ? it
              : { ...it, price: chopsticksPriceT, name: chopsticksLabel, qty: 1 }
            : it
        );
        if (updated.some((it, idx) => it !== next[idx])) {
          next = updated;
          changed = true;
        }
      } else if (!getChopsticksOptOut()) {
        next = [...next, { product_id: CHOPSTICKS_ITEM_ID, name: chopsticksLabel, price: chopsticksPriceT, qty: 1 }];
        changed = true;
      }
    }

    if (changed) {
      setItems(next);
      setCart(next);
    }
  }, [fees.pack, items, locale, packageLabel, packagePriceT, chopsticksLabel, chopsticksPriceT]);

  function togglePackage() {
    if (!hasProducts || fees.pack <= 0) return;
    if (packageItem) {
      setPackageOptOut(true);
      const next = items.filter((it) => !isPackageItem(it));
      setItems(next);
      setCart(next);
    } else {
      setPackageOptOut(false);
      const next = [
        ...items,
        { product_id: PACKAGE_ITEM_ID, name: packageLabel, price: packagePriceT, qty: 1 },
      ];
      setItems(next);
      setCart(next);
    }
  }

  function toggleChopsticks() {
    if (!hasProducts) return;
    if (chopsticksItem) {
      setChopsticksOptOut(true);
      const next = items.filter((it) => !isChopsticksItem(it));
      setItems(next);
      setCart(next);
    } else {
      setChopsticksOptOut(false);
      const next = [
        ...items,
        { product_id: CHOPSTICKS_ITEM_ID, name: chopsticksLabel, price: chopsticksPriceT, qty: 1 },
      ];
      setItems(next);
      setCart(next);
    }
  }

  return (
    <div className="ws-page">
      <Header locale={locale} />

      <main className="site-main">
        <div className="ws-container cart-shell">
          <div className="site-section__head">
            <div>
              <p className="site-eyebrow">{t(locale, "common.cart")}</p>
              <h1 className="site-title">{t(locale, "common.cart")}</h1>
              <p className="site-subtitle">
                {locale === "uz"
                  ? "Buyurtmangizni tekshiring va davom eting."
                  : "Проверьте заказ перед оформлением."}
              </p>
            </div>
          </div>

          {!hasProducts ? (
            <div className="site-card">
              <div className="site-title" style={{ fontSize: 18 }}>
                {locale === "uz" ? "Savat bo'sh" : "Корзина пустая"}
              </div>
              <p className="site-subtitle">
                {locale === "uz"
                  ? "Menyudan taom tanlang va savatga qo'shing."
                  : "Выберите блюда из меню и добавьте в корзину."}
              </p>
              <Link className="site-button site-button--primary" href={`/${locale}/menu`}>
                {locale === "uz" ? "Menyuga o'tish" : "Перейти к меню"}
              </Link>
            </div>
          ) : (
            <div className="cart-list">
              {productItems.map((it) => (
                <div key={it.product_id} className="cart-row">
                  <div className="cart-item">
                    <div className="cart-thumb" aria-hidden>
                      {it.image ? (
                        <img src={it.image} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <div className="cart-thumb__empty" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{it.name}</div>
                      <div className="site-subtitle">
                        {(it.price / 100).toLocaleString()} {currency}
                      </div>
                    </div>
                  </div>

                  <div className="cart-qty">
                    <button
                      className="qty-btn"
                      onClick={() => setItems(updateQty(it.product_id, it.qty - 1))}
                    >
                      −
                    </button>
                    <div style={{ width: 24, textAlign: "center", fontWeight: 700 }}>
                      {it.qty}
                    </div>
                    <button
                      className="qty-btn"
                      onClick={() => setItems(updateQty(it.product_id, it.qty + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {hasProducts ? (
                <div className="cart-row cart-row--package">
                  <div className="cart-item">
                    <div className="cart-thumb" aria-hidden>
                      <div className="cart-thumb__empty" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{chopsticksLabel}</div>
                      <div className="site-subtitle">
                        {chopsticksPriceT.toLocaleString()} {currency}
                      </div>
                    </div>
                  </div>
                  <button
                    className="cart-remove"
                    onClick={toggleChopsticks}
                  >
                    {chopsticksItem ? (locale === "uz" ? "Olib tashlash" : "Убрать") : (locale === "uz" ? "Qo'shish" : "Добавить")}
                  </button>
                </div>
              ) : null}

              {fees.pack > 0 && hasProducts ? (
                <div className="cart-row cart-row--package">
                  <div className="cart-item">
                    <div className="cart-thumb" aria-hidden>
                      <div className="cart-thumb__empty" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{packageLabel}</div>
                      <div className="site-subtitle">
                        {fees.pack.toLocaleString()} {currency}
                      </div>
                    </div>
                  </div>
                  <button
                    className="cart-remove"
                    onClick={togglePackage}
                  >
                    {packageItem ? (locale === "uz" ? "Olib tashlash" : "Убрать") : (locale === "uz" ? "Qo'shish" : "Добавить")}
                  </button>
                </div>
              ) : null}

              <div className="cart-row">
                <div style={{ fontWeight: 700 }}>
                  {locale === "uz" ? "Yetkazish" : "Доставка"}
                </div>
                <div style={{ fontWeight: 700 }}>
                  {fees.delivery.toLocaleString()} {currency}
                </div>
              </div>

              {packageItem ? (
                <div className="cart-row">
                  <div style={{ fontWeight: 700 }}>
                    {packageLabel}
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {packageSum.toLocaleString()} {currency}
                  </div>
                </div>
              ) : null}

              <div className="cart-row">
                <div style={{ fontWeight: 700 }}>{t(locale, "common.total")}</div>
                <div style={{ fontWeight: 700 }}>
                  {totalSum.toLocaleString()} {currency}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="site-button site-button--ghost"
                  onClick={() => {
                    clearCart();
                    setItems([]);
                  }}
                >
                  {locale === "uz" ? "Tozalash" : "Очистить"}
                </button>
                <Link className="site-button site-button--primary" href={`/${locale}/checkout`}>
                  {t(locale, "common.checkout")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
