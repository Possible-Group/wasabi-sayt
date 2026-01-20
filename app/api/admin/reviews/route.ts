import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  id: z.number().int().optional(),
  authorName: z.string().min(1),
  authorRole: z.string().optional(),
  titleRu: z.string().optional(),
  titleUz: z.string().optional(),
  textRu: z.string().optional(),
  textUz: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  photoUrl: z.string().optional(),
  publishedAt: z.string().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.review.findMany({
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { id: "desc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());
  const publishedAt = parseDate(body.publishedAt);

  const row = body.id
    ? await prisma.review.update({
        where: { id: body.id },
        data: {
          authorName: body.authorName,
          authorRole: body.authorRole || null,
          titleRu: body.titleRu || null,
          titleUz: body.titleUz || null,
          textRu: body.textRu || null,
          textUz: body.textUz || null,
          rating: body.rating ?? 5,
          photoUrl: body.photoUrl || null,
          publishedAt,
          sortOrder: body.sortOrder ?? 0,
          active: body.active ?? true,
        },
      })
    : await prisma.review.create({
        data: {
          authorName: body.authorName,
          authorRole: body.authorRole || null,
          titleRu: body.titleRu || null,
          titleUz: body.titleUz || null,
          textRu: body.textRu || null,
          textUz: body.textUz || null,
          rating: body.rating ?? 5,
          photoUrl: body.photoUrl || null,
          publishedAt,
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

  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
