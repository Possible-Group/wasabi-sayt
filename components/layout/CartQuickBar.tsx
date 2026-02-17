"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cartSubtotal, getCart, type CartItem } from "@/lib/cart/cart";

const COPY = {
  ru: {
    cart: "Корзина",
    currency: "сум",
    itemOne: "товар",
    itemFew: "товара",
    itemMany: "товаров",
  },
  uz: {
    cart: "Savat",
    currency: "so'm",
    items: "ta",
  },
} as const;

function formatItemsCount(locale: string, count: number) {
  if (locale === "uz") return `${count} ${COPY.uz.items}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${COPY.ru.itemOne}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${COPY.ru.itemFew}`;
  return `${count} ${COPY.ru.itemMany}`;
}

export default function CartQuickBar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(getCart());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("wasabi-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("wasabi-cart-updated", sync);
    };
  }, []);

  const copy = locale === "uz" ? COPY.uz : COPY.ru;
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const total = useMemo(() => cartSubtotal(items), [items]);
  const itemsLabel = useMemo(() => formatItemsCount(locale, totalItems), [locale, totalItems]);
  const isHiddenRoute =
    pathname?.startsWith("/admin") || pathname?.includes("/cart") || pathname?.includes("/checkout");

  if (!totalItems || isHiddenRoute) return null;

  return (
    <Link href={`/${locale}/cart`} className="site-cart-quick" aria-label={copy.cart}>
      <span className="site-cart-quick__left">
        <span className="site-cart-quick__icon">
          <CartIcon />
        </span>
        <span className="site-cart-quick__title">{copy.cart}</span>
      </span>
      <span className="site-cart-quick__meta">{itemsLabel}</span>
      <span className="site-cart-quick__right">
        <span className="site-cart-quick__sum">{(total / 100).toLocaleString()}</span>
        <span className="site-cart-quick__currency">{copy.currency}</span>
      </span>
    </Link>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h2l2.4 9.5a2 2 0 0 0 2 1.5h7.2a2 2 0 0 0 2-1.6L21 8H7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}
