import { NextResponse } from "next/server";
import { posterFetch } from "@/lib/poster/posterClient";
import { mapPosterProducts } from "@/lib/poster/posterMapper";
import { cached } from "@/lib/poster/posterCache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

export const dynamic = "force-dynamic";

function hasOffMarker(value: any): boolean {
  if (typeof value !== "string") return false;
  return value.toLowerCase().includes("&off");
}

function isHiddenCategoryName(value: any): boolean {
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase() === "top screen";
}

function getCategoryNameRaw(c: any): string {
  if (!c || typeof c !== "object") return "";
  return String(c.category_name ?? c.name ?? c.title ?? "").trim();
}

async function getOffCategoryIds(): Promise<Set<string>> {
  const data = await cached("poster:categories", 60_000, () =>
    posterFetch<{ response?: any }>("menu.getCategories")
  );
  const list = Array.isArray((data as any)?.response) ? (data as any).response : [];
  const offIds = new Set<string>();
  list.forEach((c: any) => {
    const name = getCategoryNameRaw(c);
    if (!name || (!hasOffMarker(name) && !isHiddenCategoryName(name))) return;
    const id = String(c?.category_id ?? c?.id ?? "").trim();
    if (id) offIds.add(id);
  });
  return offIds;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category_id = searchParams.get("category_id") || undefined;
  const includeHidden = searchParams.get("include_hidden") === "1";

  if (includeHidden) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await posterFetch<any>("menu.getProducts", { category_id });
  let mapped = mapPosterProducts(raw, { includeOff: includeHidden });

  if (!category_id && mapped.length === 0) {
    const catsRaw = await posterFetch<any>("menu.getCategories");
    const cats =
      (Array.isArray(catsRaw?.response) && catsRaw.response) ||
      (Array.isArray(catsRaw?.categories) && catsRaw.categories) ||
      [];
    const ids = cats
      .map((c: any) => String(c?.category_id ?? c?.id ?? "").trim())
      .filter(Boolean);
    const perCat = await Promise.all(
      ids.map((id: string) =>
        posterFetch<any>("menu.getProducts", { category_id: id }).catch(() => null)
      )
    );
    mapped = perCat.flatMap((res, idx) => {
      if (!res) return [];
      const list = mapPosterProducts(res, { includeOff: includeHidden });
      if (!list.length) return [];
      const catId = ids[idx];
      return list.map((p: any) => (p.category_id ? p : { ...p, category_id: catId }));
    });
  }

  if (!includeHidden) {
    const offCategoryIds = await getOffCategoryIds();
    if (offCategoryIds.size) {
      mapped = mapped.filter((p: any) => !offCategoryIds.has(String(p.category_id ?? "").trim()));
    }
  }

  if (!includeHidden) {
    const hiddenRows = await prisma.productTranslation.findMany({
      where: { hidden: true },
      select: { productId: true },
    });
    if (hiddenRows.length) {
      const hiddenSet = new Set(hiddenRows.map((r) => r.productId));
      return NextResponse.json(
        mapped.filter((p: any) => !hiddenSet.has(String(p.product_id ?? p.id ?? "")))
      );
    }
  }

  return NextResponse.json(mapped);
}
