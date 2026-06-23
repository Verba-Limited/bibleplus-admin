import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_KEY = "adminAccessToken";

export function proxy(request: NextRequest) {
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE_KEY)?.value);
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isLoginRoute = request.nextUrl.pathname === "/";

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
