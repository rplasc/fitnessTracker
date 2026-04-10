import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Optimistic auth check: if no ASP.NET cookie present, redirect to login.
  // The API will return 401 if the cookie is invalid; pages handle that too.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(".AspNetCore"));

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
