import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  ids: z.array(z.string()),
});

function parseIds(raw?: string | null) {
  if (!raw) return [] as string[];
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map((id) => String(id).trim()).filter(Boolean);
    }
  } catch {
    // ignore invalid JSON
  }
  return [];
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.botSetting.findUnique({ where: { key: "popular_products" } });
  return NextResponse.json({ ids: parseIds(row?.value) });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());
  const ids = Array.from(new Set(body.ids.map((id) => String(id).trim()).filter(Boolean)));
  const value = JSON.stringify(ids);

  await prisma.botSetting.upsert({
    where: { key: "popular_products" },
    create: { key: "popular_products", value },
    update: { value },
  });

  return NextResponse.json({ ok: true, ids });
}
