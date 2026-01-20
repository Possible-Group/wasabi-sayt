import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");

  const where: any = { active: true };
  if (locale === "ru" || locale === "uz") {
    where.OR = [{ locale }, { locale: "all" }];
  }

  const rows = await prisma.banner.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json(rows);
}
