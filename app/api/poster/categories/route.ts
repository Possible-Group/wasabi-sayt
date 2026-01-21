import { NextResponse } from "next/server";
import { posterFetch } from "@/lib/poster/posterClient";
import { cached } from "@/lib/poster/posterCache";
import { requireAdmin } from "@/lib/auth/adminAuth";

type PosterCategoriesResp = {
  response: any;
};

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeHidden = searchParams.get("include_hidden") === "1";

  if (includeHidden) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await cached("poster:categories", 60_000, () =>
    posterFetch<PosterCategoriesResp>("/menu.getCategories")
  );
  const list = Array.isArray(data?.response) ? data.response : [];
  const base = process.env.POSTER_BASE_URL;
  let origin = "";
  if (base) {
    try {
      origin = new URL(base).origin;
    } catch {
      origin = "";
    }
  }
  const withOrigin = (value: any) => {
    const v = typeof value === "string" ? value.trim() : "";
    if (!v) return null;
    if (v.startsWith("/") && origin) return `${origin}${v}`;
    return v;
  };

  const filtered = includeHidden
    ? list
    : list.filter((c: any) => {
        const name = getCategoryNameRaw(c);
        return !hasOffMarker(name) && !isHiddenCategoryName(name);
      });

  const mapped = filtered.map((c: any) => ({
    ...c,
    photo: withOrigin(c.category_photo ?? c.photo ?? c.image),
  }));

  return NextResponse.json(mapped);
}
