"use client";

import { useMemo, useState } from "react";

export type AboutLocation = {
  id: string;
  nameRu?: string | null;
  nameUz?: string | null;
  addressRu?: string | null;
  addressUz?: string | null;
  descRu?: string | null;
  descUz?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type MapPoint = { lat: number; lng: number };

function buildYandexMapUrl(points: MapPoint[], center?: MapPoint, zoom?: number) {
  if (!points.length) return "";
  const safeCenter = center ?? points[0];
  const pt = points.map((p) => `${p.lng},${p.lat},pm2rdm`).join("~");
  const ll = `${safeCenter.lng},${safeCenter.lat}`;
  const z = zoom ?? (points.length > 1 ? 12 : 15);
  return `https://yandex.ru/map-widget/v1/?ll=${ll}&pt=${pt}&z=${z}`;
}

function buildYandexLink(points: MapPoint[], center?: MapPoint, zoom?: number) {
  if (!points.length) return "";
  const safeCenter = center ?? points[0];
  const pt = points.map((p) => `${p.lng},${p.lat},pm2rdm`).join("~");
  const ll = `${safeCenter.lng},${safeCenter.lat}`;
  const z = zoom ?? (points.length > 1 ? 12 : 15);
  return `https://yandex.ru/maps/?ll=${ll}&pt=${pt}&z=${z}`;
}

export default function LocationsSection({
  locale,
  locations,
}: {
  locale: "ru" | "uz";
  locations: AboutLocation[];
}) {
  const [activeId, setActiveId] = useState(locations[0]?.id ?? "");
  const active = useMemo(
    () => locations.find((l) => l.id === activeId) ?? locations[0],
    [locations, activeId]
  );
  const points = useMemo(() => {
    return locations.flatMap((loc) => {
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      return [{ lat, lng }];
    });
  }, [locations]);
  const activePoint = useMemo(() => {
    if (!active) return undefined;
    const lat = Number(active.lat);
    const lng = Number(active.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
    return { lat, lng };
  }, [active]);

  if (!locations.length) return null;

  return (
    <div className="about-locations">
      <div className="about-map">
        {points.length ? (
          <iframe
            title="map"
            src={buildYandexMapUrl(points, activePoint)}
            loading="lazy"
            style={{ border: 0 }}
            allowFullScreen
          />
        ) : (
          <div className="about-map__empty">
            {locale === "uz" ? "Xaritada ko'rsatish uchun koordinata yo'q." : "Нет координат для карты."}
          </div>
        )}
        {points.length ? (
          <a
            className="about-map__link"
            href={buildYandexLink(points, activePoint)}
            target="_blank"
            rel="noreferrer"
          >
            {locale === "uz" ? "Xaritani ochish" : "Открыть карту"}
          </a>
        ) : null}
      </div>

      <div className="about-location-list">
        {locations.map((loc) => {
          const name = locale === "uz" ? loc.nameUz : loc.nameRu;
          const address = locale === "uz" ? loc.addressUz : loc.addressRu;
          const desc = locale === "uz" ? loc.descUz : loc.descRu;
          const isActive = loc.id === active?.id;
          return (
            <button
              key={loc.id}
              type="button"
              className={`about-location-card${isActive ? " is-active" : ""}`}
              onClick={() => setActiveId(loc.id)}
            >
              <div className="about-location-card__title">{name || (locale === "uz" ? "Lokatsiya" : "Локация")}</div>
              {address ? <div className="about-location-card__address">{address}</div> : null}
              {desc ? <div className="about-location-card__desc">{desc}</div> : null}
              {loc.lat && loc.lng ? (
                <div className="about-location-card__coords">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
