import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getClientSession } from "@/lib/auth/clientAuth";

const LocationSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

const Body = z.object({
  locations: z.array(LocationSchema).max(10),
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
  const session = await getClientSession();
  if (!session) return NextResponse.json({ locations: [] });

  const row = await prisma.botSetting.findUnique({
    where: { key: `client_locations:${session.clientId}` },
  });
  return NextResponse.json({ locations: parseLocations(row?.value) });
}

export async function POST(req: Request) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = Body.parse(await req.json());
  const value = JSON.stringify(body.locations);

  await prisma.botSetting.upsert({
    where: { key: `client_locations:${session.clientId}` },
    create: { key: `client_locations:${session.clientId}`, value },
    update: { value },
  });

  return NextResponse.json({ ok: true, locations: body.locations });
}
