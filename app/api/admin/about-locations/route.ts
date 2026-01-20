import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const LocationSchema = z.object({
  id: z.string().min(1),
  spotId: z.string().optional().nullable(),
  nameRu: z.string().optional().nullable(),
  nameUz: z.string().optional().nullable(),
  addressRu: z.string().optional().nullable(),
  addressUz: z.string().optional().nullable(),
  descRu: z.string().optional().nullable(),
  descUz: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

const Body = z.object({
  locations: z.array(LocationSchema).max(3),
});

function parseLocations(raw?: string | null) {
  if (!raw) return [] as any[];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.botSetting.findUnique({ where: { key: "about_locations" } });
  return NextResponse.json({ locations: parseLocations(row?.value) });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());
  const value = JSON.stringify(body.locations);

  await prisma.botSetting.upsert({
    where: { key: "about_locations" },
    create: { key: "about_locations", value },
    update: { value },
  });

  return NextResponse.json({ ok: true, locations: body.locations });
}
