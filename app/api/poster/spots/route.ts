import { NextResponse } from "next/server";
import { posterFetch } from "@/lib/poster/posterClient";

export const dynamic = "force-dynamic";

type PosterSpot = {
  spot_id: number;
  name: string;
  address?: string | null;
  lat?: string | null;
  lng?: string | null;
  spot_delete?: number;
};

export async function GET() {
  const data = await posterFetch<{ response: PosterSpot[] }>("spots.getSpots");
  const list = Array.isArray(data?.response) ? data.response : [];
  const mapped = list
    .filter((s) => !s.spot_delete)
    .map((s) => ({
      spot_id: String(s.spot_id),
      name: s.name,
      address: s.address ?? "",
      lat: s.lat ? Number(s.lat) : null,
      lng: s.lng ? Number(s.lng) : null,
    }));
  return NextResponse.json(mapped);
}
