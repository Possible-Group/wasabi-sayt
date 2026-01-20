import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Location = {
  id: string;
  spotId?: string | null;
  nameRu?: string | null;
  nameUz?: string | null;
  addressRu?: string | null;
  addressUz?: string | null;
  descRu?: string | null;
  descUz?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function parseLocations(raw?: string | null): Location[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Location[]) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const row = await prisma.botSetting.findUnique({ where: { key: "about_locations" } });
  return NextResponse.json({ locations: parseLocations(row?.value) });
}
