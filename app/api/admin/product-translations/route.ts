import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  productId: z.string().min(1),
  nameUz: z.string().optional(),
  descUz: z.string().optional(),
  seoTitleRu: z.string().optional(),
  seoDescRu: z.string().optional(),
  seoKeywordsRu: z.string().optional(),
  seoTitleUz: z.string().optional(),
  seoDescUz: z.string().optional(),
  seoKeywordsUz: z.string().optional(),
  hidden: z.boolean().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.productTranslation.findMany();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());

  const row = await prisma.productTranslation.upsert({
    where: { productId: body.productId },
    create: {
      productId: body.productId,
      nameUz: body.nameUz || null,
      descUz: body.descUz || null,
      seoTitleRu: body.seoTitleRu || null,
      seoDescRu: body.seoDescRu || null,
      seoKeywordsRu: body.seoKeywordsRu || null,
      seoTitleUz: body.seoTitleUz || null,
      seoDescUz: body.seoDescUz || null,
      seoKeywordsUz: body.seoKeywordsUz || null,
      hidden: body.hidden ?? false,
    },
    update: {
      nameUz: body.nameUz ?? null,
      descUz: body.descUz ?? null,
      seoTitleRu: body.seoTitleRu ?? null,
      seoDescRu: body.seoDescRu ?? null,
      seoKeywordsRu: body.seoKeywordsRu ?? null,
      seoTitleUz: body.seoTitleUz ?? null,
      seoDescUz: body.seoDescUz ?? null,
      seoKeywordsUz: body.seoKeywordsUz ?? null,
      hidden: body.hidden ?? false,
    },
  });

  return NextResponse.json({ ok: true, row });
}
