import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const StatSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  labelRu: z.string().optional().nullable(),
  labelUz: z.string().optional().nullable(),
});

const Body = z.object({
  badgeRu: z.string().optional().nullable(),
  badgeUz: z.string().optional().nullable(),
  stats: z.array(StatSchema).max(6),
});

function parseStats(raw?: string | null) {
  if (!raw) return { badgeRu: "", badgeUz: "", stats: [] as any[] };
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return { badgeRu: "", badgeUz: "", stats: [] };
    return {
      badgeRu: typeof data.badgeRu === "string" ? data.badgeRu : "",
      badgeUz: typeof data.badgeUz === "string" ? data.badgeUz : "",
      stats: Array.isArray(data.stats) ? data.stats : [],
    };
  } catch {
    return { badgeRu: "", badgeUz: "", stats: [] };
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.botSetting.findUnique({ where: { key: "about_stats" } });
  return NextResponse.json(parseStats(row?.value));
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());
  const value = JSON.stringify(body);

  await prisma.botSetting.upsert({
    where: { key: "about_stats" },
    create: { key: "about_stats", value },
    update: { value },
  });

  return NextResponse.json({ ok: true, ...body });
}
