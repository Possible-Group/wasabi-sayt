"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { addToCart, getCart, updateQty } from "@/lib/cart/cart";
import type { Locale } from "@/lib/i18n/config";

type ProductTileModel = {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  image: string;
  href?: string;
};

export default function ProductTile({
  product,
  className,
  addLabel,
  locale,
}: {
  product: ProductTileModel;
  className: string;
  addLabel: string;
  locale: Locale;
}) {
  const [qty, setQty] = useState(0);

  const syncQty = useCallback(() => {
    const item = getCart().find((x) => x.product_id === product.id);
    setQty(item?.qty || 0);
  }, [product.id]);

  useEffect(() => {
    syncQty();
    const onCartUpdated = () => syncQty();
    window.addEventListener("wasabi-cart-updated", onCartUpdated);
    return () => window.removeEventListener("wasabi-cart-updated", onCartUpdated);
  }, [syncQty]);

  const minusLabel = locale === "uz" ? "Kamaytirish" : "Уменьшить";
  const plusLabel = locale === "uz" ? "Ko'paytirish" : "Увеличить";

  const renderContent = (
    <>
      <div className="site-product-card__img">
        <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
      </div>
      <div className="site-product-card__title">{product.title}</div>
      <div className="site-product-card__price">{product.price}</div>
    </>
  );

  const handleAdd = () => {
    setQty((prev) => prev + 1);
    addToCart(
      {
        product_id: product.id,
        name: product.title,
        price: product.priceValue,
        image: product.image,
      },
      1
    );
  };

  const handleDec = () => {
    const nextQty = Math.max(0, qty - 1);
    setQty(nextQty);
    updateQty(product.id, nextQty);
  };

  const handleInc = () => {
    const nextQty = qty + 1;
    setQty(nextQty);
    updateQty(product.id, nextQty);
  };

  return (
    <article className={className} role="listitem" aria-label={product.title}>
      {product.href ? (
        <Link href={product.href} className="site-product-card__media" aria-label={product.title}>
          {renderContent}
        </Link>
      ) : (
        <div className="site-product-card__media">{renderContent}</div>
      )}
      <div className="site-product-card__actions">
        {qty > 0 ? (
          <div className="site-qty" aria-label={locale === "uz" ? "Soni" : "Количество"}>
            <button type="button" className="site-qty__btn" onClick={handleDec} aria-label={minusLabel}>
              -
            </button>
            <div className="site-qty__val">{qty}</div>
            <button type="button" className="site-qty__btn" onClick={handleInc} aria-label={plusLabel}>
              +
            </button>
          </div>
        ) : (
          <button type="button" className="site-button site-button--ghost" onClick={handleAdd}>
            {addLabel}
          </button>
        )}
      </div>
    </article>
  );
}
