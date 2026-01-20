import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  id: z.number().int().optional(),
  slug: z.string().min(1),
  imageUrl: z.string().min(1),
  titleRu: z.string().min(1),
  titleUz: z.string().min(1),
  excerptRu: z.string().min(1),
  excerptUz: z.string().min(1),
  bodyRu: z.string().min(1),
  bodyUz: z.string().min(1),
  seoTitleRu: z.string().optional(),
  seoDescriptionRu: z.string().optional(),
  seoKeywordsRu: z.string().optional(),
  seoTitleUz: z.string().optional(),
  seoDescriptionUz: z.string().optional(),
  seoKeywordsUz: z.string().optional(),
  publishedAt: z.string().optional(),
  active: z.boolean().optional(),
});

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clean(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.newsItem.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());
  const publishedAt = parseDate(body.publishedAt);
  const slug = normalizeSlug(body.slug);
  if (!slug) {
    return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
  }

  try {
    const row = body.id
      ? await prisma.newsItem.update({
          where: { id: body.id },
          data: {
            slug,
            imageUrl: clean(body.imageUrl),
            titleRu: clean(body.titleRu),
            titleUz: clean(body.titleUz),
            excerptRu: clean(body.excerptRu),
            excerptUz: clean(body.excerptUz),
            bodyRu: clean(body.bodyRu),
            bodyUz: clean(body.bodyUz),
            seoTitleRu: clean(body.seoTitleRu) || null,
            seoDescriptionRu: clean(body.seoDescriptionRu) || null,
            seoKeywordsRu: clean(body.seoKeywordsRu) || null,
            seoTitleUz: clean(body.seoTitleUz) || null,
            seoDescriptionUz: clean(body.seoDescriptionUz) || null,
            seoKeywordsUz: clean(body.seoKeywordsUz) || null,
            publishedAt,
            active: body.active ?? true,
          },
        })
      : await prisma.newsItem.create({
          data: {
            slug,
            imageUrl: clean(body.imageUrl),
            titleRu: clean(body.titleRu),
            titleUz: clean(body.titleUz),
            excerptRu: clean(body.excerptRu),
            excerptUz: clean(body.excerptUz),
            bodyRu: clean(body.bodyRu),
            bodyUz: clean(body.bodyUz),
            seoTitleRu: clean(body.seoTitleRu) || null,
            seoDescriptionRu: clean(body.seoDescriptionRu) || null,
            seoKeywordsRu: clean(body.seoKeywordsRu) || null,
            seoTitleUz: clean(body.seoTitleUz) || null,
            seoDescriptionUz: clean(body.seoDescriptionUz) || null,
            seoKeywordsUz: clean(body.seoKeywordsUz) || null,
            publishedAt,
            active: body.active ?? true,
          },
        });

    return NextResponse.json({ ok: true, row });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "SLUG_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || 0);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.newsItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
