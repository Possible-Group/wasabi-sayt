import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function numberParam(value: string | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parsePos(pos?: string | null) {
  const raw = String(pos || "").trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  if (parts.length < 2) return null;
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function buildYandexAddress(geoObject: any) {
  return String(
    geoObject?.metaDataProperty?.GeocoderMetaData?.text ||
      geoObject?.metaDataProperty?.GeocoderMetaData?.Address?.formatted ||
      geoObject?.name ||
      ""
  ).trim();
}

function getGeoApiKey() {
  return process.env.YANDEX_GEOCODER_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = String(url.searchParams.get("q") || "").trim();
  const langRaw = String(url.searchParams.get("lang") || "ru_RU").trim();
  const lang = ["ru_RU", "uz_UZ", "en_US"].includes(langRaw) ? langRaw : "ru_RU";
  const lat = numberParam(url.searchParams.get("lat"));
  const lng = numberParam(url.searchParams.get("lng"));

  const apiKey = getGeoApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "MISSING_KEY" }, { status: 500 });
  }

  if (query) {
    const geoUrl = new URL("https://geocode-maps.yandex.ru/1.x/");
    geoUrl.searchParams.set("apikey", apiKey);
    geoUrl.searchParams.set("format", "json");
    geoUrl.searchParams.set("lang", lang);
    geoUrl.searchParams.set("geocode", query);
    geoUrl.searchParams.set("results", "6");

    const res = await fetch(geoUrl.toString(), { cache: "no-store" });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { error: "GEOCODER_SEARCH_ERROR", detail: text || res.statusText },
        { status: 502 }
      );
    }

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    const featureMembers = Array.isArray(data?.response?.GeoObjectCollection?.featureMember)
      ? data.response.GeoObjectCollection.featureMember
      : [];

    const results = featureMembers
      .map((member: any) => member?.GeoObject)
      .map((geoObject: any) => {
        const pos = parsePos(geoObject?.Point?.pos);
        const address = buildYandexAddress(geoObject);
        if (!pos || !address) return null;
        return {
          address,
          lat: pos.lat,
          lng: pos.lng,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ query, results });
  }

  if (lat === null || lng === null) {
    return NextResponse.json({ error: "INVALID_COORDS" }, { status: 400 });
  }

  const geoUrl = new URL("https://geocode-maps.yandex.ru/1.x/");
  geoUrl.searchParams.set("apikey", apiKey);
  geoUrl.searchParams.set("format", "json");
  geoUrl.searchParams.set("lang", lang);
  geoUrl.searchParams.set("geocode", `${lng},${lat}`);
  geoUrl.searchParams.set("results", "1");

  const res = await fetch(geoUrl.toString(), { cache: "no-store" });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    return NextResponse.json(
      { error: "GEOCODER_ERROR", detail: text || res.statusText },
      { status: 502 }
    );
  }

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  const geoObject =
    data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject ?? null;
  const address = buildYandexAddress(geoObject);

  return NextResponse.json({ address });
}
