"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/t";
import { cartSubtotal, getCart, updateQty, clearCart, type CartItem } from "@/lib/cart/cart";
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

  const subtotal = cartSubtotal(items);
  const subtotalSum = subtotal / 100;
  const totalSum = subtotalSum + fees.delivery + fees.pack;
  const currency = locale === "uz" ? "so'm" : "сум";

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

          {items.length === 0 ? (
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
              {items.map((it) => (
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

              <div className="cart-row">
                <div style={{ fontWeight: 700 }}>
                  {locale === "uz" ? "Yetkazish" : "Доставка"}
                </div>
                <div style={{ fontWeight: 700 }}>
                  {fees.delivery.toLocaleString()} {currency}
                </div>
              </div>

              <div className="cart-row">
                <div style={{ fontWeight: 700 }}>
                  {locale === "uz" ? "Qadoq" : "Упаковка"}
                </div>
                <div style={{ fontWeight: 700 }}>
                  {fees.pack.toLocaleString()} {currency}
                </div>
              </div>

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
