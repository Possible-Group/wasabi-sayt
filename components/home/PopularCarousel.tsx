"use client";

import { useRef } from "react";
import Link from "next/link";

type ProductCard = {
  id: string;
  title: string;
  price: string;
  image: string;
  href?: string;
};

export default function PopularCarousel({
  products,
  locale,
  ctaLabel,
}: {
  products: ProductCard[];
  locale: string;
  ctaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>(".site-carousel__item");
    const step = item ? item.getBoundingClientRect().width + 18 : 280;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <div className="site-carousel" aria-label="Популярные товары">
      <button
        className="site-carousel__nav is-prev"
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label={locale === "uz" ? "Oldinga" : "Назад"}
      >
        <ChevronIcon />
      </button>
      <div ref={trackRef} className="site-carousel__track">
        {products.map((prod) => (
          <article key={prod.id} className="site-product-card site-carousel__item">
            <div className="site-product-card__img">
              <img src={prod.image} alt={prod.title} loading="lazy" decoding="async" />
            </div>
            <div className="site-product-card__title">{prod.title}</div>
            <div className="site-product-card__price">{prod.price}</div>
            <Link
              className="site-button site-button--ghost"
              href={prod.href || `/${locale}/menu/${prod.id}`}
            >
              {ctaLabel}
            </Link>
          </article>
        ))}
      </div>
      <button
        className="site-carousel__nav is-next"
        type="button"
        onClick={() => scrollBy(1)}
        aria-label={locale === "uz" ? "Keyingi" : "Вперед"}
      >
        <ChevronIcon />
      </button>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
