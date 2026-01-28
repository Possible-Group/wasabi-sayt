import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  categoryId: z.string().min(1),
  nameUz: z.string().optional(),
  sortOrder: z.number().int().nullable().optional(),
  seoTitleRu: z.string().optional(),
  seoDescRu: z.string().optional(),
  seoKeywordsRu: z.string().optional(),
  seoTitleUz: z.string().optional(),
  seoDescUz: z.string().optional(),
  seoKeywordsUz: z.string().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.categoryTranslation.findMany();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());

  const row = await prisma.categoryTranslation.upsert({
    where: { categoryId: body.categoryId },
    create: {
      categoryId: body.categoryId,
      nameUz: body.nameUz || null,
      sortOrder: body.sortOrder ?? null,
      seoTitleRu: body.seoTitleRu || null,
      seoDescRu: body.seoDescRu || null,
      seoKeywordsRu: body.seoKeywordsRu || null,
      seoTitleUz: body.seoTitleUz || null,
      seoDescUz: body.seoDescUz || null,
      seoKeywordsUz: body.seoKeywordsUz || null,
    },
    update: {
      nameUz: body.nameUz ?? null,
      sortOrder: body.sortOrder ?? null,
      seoTitleRu: body.seoTitleRu ?? null,
      seoDescRu: body.seoDescRu ?? null,
      seoKeywordsRu: body.seoKeywordsRu ?? null,
      seoTitleUz: body.seoTitleUz ?? null,
      seoDescUz: body.seoDescUz ?? null,
      seoKeywordsUz: body.seoKeywordsUz ?? null,
    },
  });

  return NextResponse.json({ ok: true, row });
}
