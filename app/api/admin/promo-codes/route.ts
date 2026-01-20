import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  code: z.string().min(2),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int().positive(),
  active: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.promoCode.findMany({ orderBy: { code: "asc" } }));
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = Body.parse(await req.json());

  await prisma.promoCode.upsert({
    where: { code: b.code },
    create: {
      code: b.code,
      type: b.type,
      value: b.value,
      active: b.active,
      startsAt: b.startsAt ? new Date(b.startsAt) : null,
      endsAt: b.endsAt ? new Date(b.endsAt) : null,
    },
    update: {
      type: b.type,
      value: b.value,
      active: b.active,
      startsAt: b.startsAt ? new Date(b.startsAt) : null,
      endsAt: b.endsAt ? new Date(b.endsAt) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
