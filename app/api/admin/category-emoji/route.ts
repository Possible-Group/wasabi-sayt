import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  categoryId: z.string().min(1),
  emoji: z.string().min(1).max(4),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.categoryEmoji.findMany());
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = Body.parse(await req.json());

  const row = await prisma.categoryEmoji.upsert({
    where: { categoryId: body.categoryId },
    create: { categoryId: body.categoryId, emoji: body.emoji },
    update: { emoji: body.emoji },
  });

  return NextResponse.json({ ok: true, row });
}
