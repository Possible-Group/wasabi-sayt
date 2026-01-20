import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function numberParam(value: string | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = numberParam(url.searchParams.get("lat"));
  const lng = numberParam(url.searchParams.get("lng"));
  if (lat === null || lng === null) {
    return NextResponse.json({ error: "INVALID_COORDS" }, { status: 400 });
  }

  const apiKey =
    process.env.YANDEX_GEOCODER_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MISSING_KEY" }, { status: 500 });
  }

  const geoUrl = new URL("https://geocode-maps.yandex.ru/1.x/");
  geoUrl.searchParams.set("apikey", apiKey);
  geoUrl.searchParams.set("format", "json");
  geoUrl.searchParams.set("lang", "ru_RU");
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
  const address =
    geoObject?.metaDataProperty?.GeocoderMetaData?.text ||
    geoObject?.metaDataProperty?.GeocoderMetaData?.Address?.formatted ||
    geoObject?.name ||
    "";

  return NextResponse.json({ address: String(address || "").trim() });
}
