// middleware.js

import { NextResponse } from "next/server";

export function middleware(request) {
  const role = request.cookies.get("userRole")?.value;
  const authPath = request.cookies.get("authPath")?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard + constituency form
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/ConstituencyForm")
  ) {
    if (!role) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role restrictions
    if (pathname.startsWith("/dashboard/Ceo_admin") && role !== "ceo") {
      return NextResponse.redirect(new URL(authPath || "/", request.url));
    }

    if (pathname.startsWith("/dashboard/Media_Admin") && role !== "media") {
      return NextResponse.redirect(new URL(authPath || "/", request.url));
    }

    if (pathname.startsWith("/ConstituencyForm") && role !== "coordinator") {
      return NextResponse.redirect(new URL(authPath || "/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/ConstituencyForm/:path*"],
};