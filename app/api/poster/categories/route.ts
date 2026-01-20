import { NextResponse } from "next/server";
import { posterFetch } from "@/lib/poster/posterClient";
import { cached } from "@/lib/poster/posterCache";

type PosterCategoriesResp = {
  response: any;
};

export async function GET() {
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

  const mapped = list.map((c: any) => ({
    ...c,
    photo: withOrigin(c.category_photo ?? c.photo ?? c.image),
  }));

  return NextResponse.json(mapped);
}
