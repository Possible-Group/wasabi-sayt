import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  id: z.number().int().optional(),
  imageUrl: z.string().min(1),
  href: z.string().optional(),
  locale: z.enum(["ru", "uz", "all"]).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());

  const row = body.id
    ? await prisma.banner.update({
        where: { id: body.id },
      data: {
        imageUrl: body.imageUrl,
        href: body.href ?? null,
        locale: body.locale ?? "all",
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
      },
      })
    : await prisma.banner.create({
        data: {
          imageUrl: body.imageUrl,
          href: body.href ?? null,
          locale: body.locale ?? "all",
          sortOrder: body.sortOrder ?? 0,
          active: body.active ?? true,
        },
      });

  return NextResponse.json({ ok: true, row });
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || 0);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
