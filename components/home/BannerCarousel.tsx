"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Banner = {
  id: string;
  image: string;
  href: string;
};

function normalizeImageSrc(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: width * active, behavior: "smooth" });
  }, [active]);

  return (
    <section className="ws-banner" aria-label="Промо">
      <div className="ws-banner__shell">
        <div ref={scrollerRef} className="ws-banner__scroller" role="list" aria-label="Баннеры">
          {banners.map((b, idx) => (
            <div key={b.id} className="ws-banner__slide" role="listitem">
              <Link href={b.href} className="ws-banner__imgLink" aria-label="Открыть баннер">
                <div className="ws-banner__img">
                  <img
                    src={normalizeImageSrc(b.image)}
                    alt="Баннер"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <div className="ws-banner__dots" aria-label="Переключение баннеров">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={idx === active ? "ws-dot is-active" : "ws-dot"}
                aria-label={`Баннер ${idx + 1}`}
                onClick={() => setActive(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
