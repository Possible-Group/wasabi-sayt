import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

const Body = z.object({
  slug: z.string().min(1),
  locale: z.enum(["ru", "uz"]),
  title: z.string().optional(),
  body: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const locale = searchParams.get("locale");

  const rows = await prisma.contentPage.findMany({
    where: {
      ...(slug ? { slug } : {}),
      ...(locale ? { locale } : {}),
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());

  const row = await prisma.contentPage.upsert({
    where: { slug_locale: { slug: body.slug, locale: body.locale } },
    create: {
      slug: body.slug,
      locale: body.locale,
      title: body.title || null,
      body: body.body || null,
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      seoKeywords: body.seoKeywords || null,
    },
    update: {
      title: body.title ?? null,
      body: body.body ?? null,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      seoKeywords: body.seoKeywords ?? null,
    },
  });

  return NextResponse.json({ ok: true, row });
}
