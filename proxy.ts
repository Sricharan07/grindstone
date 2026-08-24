import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((request) => {
  if (process.env.AUTH_REQUIRED !== "true") return NextResponse.next();
  if (!request.auth) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/health|login|_next/static|_next/image|favicon.ico).*)"],
};
