function parsePrice(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value
      .replace(/\s+/g, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const n = parsePrice(item);
      if (n && n > 0) return n;
    }
    return null;
  }
  if (typeof value === "object") {
    const maybe = [
      (value as any).price,
      (value as any).value,
      (value as any).sum,
      (value as any).amount,
    ];
    for (const v of maybe) {
      const n = parsePrice(v);
      if (n && n > 0) return n;
    }
    for (const v of Object.values(value)) {
      const n = parsePrice(v);
      if (n && n > 0) return n;
    }
  }
  return null;
}

function pickPrice(p: any): number {
  const candidates = [
    p?.price?.[1],
    p?.price?.["1"],
    p?.price,
    p?.product_price,
    p?.price_sum,
    p?.price_1,
    p?.price1,
    p?.price2,
    p?.price3,
    p?.price4,
    p?.price5,
    p?.price6,
    p?.price7,
    p?.price8,
    p?.price9,
    p?.prices,
  ];
  for (const v of candidates) {
    const n = parsePrice(v);
    if (n && n > 0) return n;
  }
  return 0;
}

function trimName(value: any): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) return "";
  const idx = name.indexOf("$");
  return idx >= 0 ? name.slice(0, idx).trim() : name;
}

function hasOffMarker(value: any): boolean {
  if (typeof value !== "string") return false;
  return value.toLowerCase().includes("&off");
}

function isHiddenCategoryName(value: any): boolean {
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase() === "top screen";
}

function isOffProduct(p: any): boolean {
  if (!p || typeof p !== "object") return false;
  return hasOffMarker(p.product_name) || hasOffMarker(p.name);
}

function getRawCategoryName(p: any): string {
  if (!p || typeof p !== "object") return "";
  return String(
    p.category_name ??
      p.menu_category_name ??
      p.category?.category_name ??
      p.category?.name ??
      p.category?.title ??
      ""
  ).trim();
}

function isOffCategory(p: any): boolean {
  const raw = getRawCategoryName(p);
  return raw ? hasOffMarker(raw) || isHiddenCategoryName(raw) : false;
}

function normalizeCategoryId(value: any): string | null {
  if (value === null || value === undefined) return null;
  const id = String(value).trim();
  return id ? id : null;
}

function enrichProduct(p: any, categoryId?: string | null) {
  if (!p || typeof p !== "object") return p;
  const existing =
    p.category_id ??
    p.categoryId ??
    p.product_category_id ??
    p.productCategoryId ??
    p.category?.category_id ??
    p.category?.id;
  const resolved = normalizeCategoryId(existing ?? categoryId);
  return resolved ? { ...p, category_id: resolved } : p;
}

function extractProducts(raw: any): any[] {
  const r = raw?.response;
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.products)) return r.products;
  if (Array.isArray(r?.items)) return r.items;

  const fromCategory = (c: any, fallbackId?: string | null) => {
    const catId = normalizeCategoryId(
      c?.category_id ?? c?.categoryId ?? c?.id ?? c?.category?.category_id ?? fallbackId
    );
    if (Array.isArray(c?.products)) return c.products.map((p: any) => enrichProduct(p, catId));
    if (Array.isArray(c?.items)) return c.items.map((p: any) => enrichProduct(p, catId));
    return [];
  };

  if (Array.isArray(r?.categories)) {
    const list = r.categories.flatMap((c: any) => fromCategory(c));
    if (list.length) return list;
  }
  if (r?.categories && typeof r.categories === "object") {
    const list = Object.entries(r.categories).flatMap(([key, c]) => fromCategory(c, key));
    if (list.length) return list;
  }

  if (r?.products && typeof r.products === "object") {
    const list = Object.entries(r.products).flatMap(([key, v]) => {
      if (Array.isArray(v)) return v.map((p: any) => enrichProduct(p, key));
      if (Array.isArray((v as any)?.products)) {
        return (v as any).products.map((p: any) => enrichProduct(p, key));
      }
      if (Array.isArray((v as any)?.items)) {
        return (v as any).items.map((p: any) => enrichProduct(p, key));
      }
      return [enrichProduct(v, key)];
    });
    if (list.length) return list;
  }

  if (r && typeof r === "object") {
    const values = Object.values(r);
    const list = values.flatMap((v) => (Array.isArray(v) ? v : []));
    if (list.length) return list;
  }

  return [];
}

type PosterMapOptions = {
  includeOff?: boolean;
};

export function mapPosterProducts(raw: any, options: PosterMapOptions = {}) {
  const list = extractProducts(raw).filter(
    (p) => p && (p.product_id || p.id || p.product_name || p.name)
  );
  const includeOff = options.includeOff === true;
  const filtered = includeOff ? list : list.filter((p) => !isOffProduct(p) && !isOffCategory(p));
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

  return filtered.map((p: any) => {
    const originCandidates = [
      p.photo_origin,
      p.photoOrigin,
      p.photo_big_origin,
      p.photoBigOrigin,
      p.photo_big,
      p.photoBig,
      p.photo_large,
      p.photoLarge,
      p.photo,
      p.image,
    ];
    const photoOriginRaw =
      originCandidates.find((v) => typeof v === "string" && v.trim()) || null;
    const photoRaw = p.photo ?? null;
    const photoBest = photoOriginRaw || photoRaw || null;

    return {
      product_id: String(p.product_id ?? p.id ?? ""),
      product_name: trimName(p.product_name ?? p.name ?? ""),
      price: pickPrice(p),
      photo: withOrigin(photoBest),
      photo_origin: withOrigin(photoOriginRaw),
      photo_raw: photoRaw,
      ingredients: p.ingredients ?? null,
      description: p.description ?? null,
      category_name:
        p.category_name ??
        p.menu_category_name ??
        p.category?.category_name ??
        p.category?.name ??
        null,
      category_id: p.category_id
        ? String(p.category_id)
        : p.menu_category_id
        ? String(p.menu_category_id)
        : p.menuCategoryId
        ? String(p.menuCategoryId)
        : p.categoryId
        ? String(p.categoryId)
        : p.category?.category_id
        ? String(p.category.category_id)
        : p.category?.id
        ? String(p.category.id)
        : p.product_category_id
        ? String(p.product_category_id)
        : p.productCategoryId
        ? String(p.productCategoryId)
        : null,
    };
  });
}
