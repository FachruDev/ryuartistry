import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { safeAdminPath } from "@/lib/admin-path";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase().slice(0, 2);
    if (isLocale(tag)) return tag;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check only; every admin page and action re-verifies the session.
  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const hasSession = Boolean(getSessionCookie(request));
    if (!hasSession && !isLogin) {
      const login = new URL("/admin/login", request.url);
      // Come back here after signing in, e.g. to finish connecting Claude on /admin/authorize.
      if (pathname !== "/admin") login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
    if (hasSession && isLogin) {
      return NextResponse.redirect(new URL(safeAdminPath(request.nextUrl.searchParams.get("next")), request.url));
    }
    return NextResponse.next();
  }

  const first = pathname.split("/")[1] ?? "";
  if (isLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip API routes, Next internals, the generated apple-icon, and files with an extension (favicon, images, sitemap.xml…).
    "/((?!api|_next|apple-icon|.*\\..*).*)",
  ],
};
