import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["ru", "uz"] as const;
const DEFAULT_LOCALE = "ru";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "wasabi_admin_session";

function makeAbsolute(req: NextRequest, path: string) {
  const h = req.headers;

  const host =
    (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();

  const proto =
    (h.get("x-forwarded-proto") || "https").split(",")[0].trim();

  // Nginx orqali kelsa: wasabisushi.uz bo'ladi
  // Local testda: host bo'lmasa, req.nextUrl.origin ishlaydi (127.0.0.1:3000)
  const origin = host ? `${proto}://${host}` : req.nextUrl.origin;

  return new URL(path, origin);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 0) Bot/path skanlarni tezda kesib tashlash (ixtiyoriy, lekin foydali)
  if (/\.(php|asp|aspx|cgi|pl)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // 1) Hech qachon teginmaymiz (API, Next internal, static)
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 2) Admin guard (ABSOLUTE redirect)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const hasSession = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!hasSession) {
      const next = encodeURIComponent(pathname);
      return NextResponse.redirect(makeAbsolute(request, `/admin/login?next=${next}`), 307);
    }
    return NextResponse.next();
  }

  // 3) Locale bor bo‘lsa — ok
  const first = pathname.split("/")[1];
  if ((LOCALES as readonly string[]).includes(first)) {
    return NextResponse.next();
  }

  // 4) Locale redirect (ABSOLUTE redirect)
  const target =
    pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;

  return NextResponse.redirect(makeAbsolute(request, target), 307);
}

export const config = {
  matcher: ["/", "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|uploads|icons).*)"],
};
