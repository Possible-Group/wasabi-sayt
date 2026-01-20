import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
  });
}
