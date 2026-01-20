import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");
  const limit = Number(searchParams.get("limit") || 0);

  const rows = await prisma.review.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { id: "desc" }],
    take: limit > 0 ? limit : undefined,
  });

  if (locale === "ru" || locale === "uz") {
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        authorRole: r.authorRole,
        title: locale === "uz" && r.titleUz ? r.titleUz : r.titleRu,
        text: locale === "uz" && r.textUz ? r.textUz : r.textRu,
        rating: r.rating,
        photoUrl: r.photoUrl,
        publishedAt: r.publishedAt ?? r.createdAt,
      }))
    );
  }

  return NextResponse.json(rows);
}
