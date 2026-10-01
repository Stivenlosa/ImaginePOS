import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/login";
  const isLoginApi = pathname === "/api/auth/login";

  if (!session && !isLogin && !isLoginApi) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (session && isLogin) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  const adminOnlyApi =
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/registers") ||
    pathname === "/api/business-day/close" ||
    pathname === "/api/register-sessions/open" ||
    (pathname === "/api/business-day" && request.method !== "GET") ||
    (pathname === "/api/register-sessions/close" && request.method !== "GET");

  const needsAdmin =
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/registers" ||
    pathname.startsWith("/registers/") ||
    adminOnlyApi;
  if (session && needsAdmin && session.role !== "administrador") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
