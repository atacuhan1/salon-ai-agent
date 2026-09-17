import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth-constants";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-salon-ai-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const path = decodeURIComponent(request.nextUrl.pathname);

  if (path === "/kayıt") {
    return NextResponse.redirect(new URL("/kayit", request.url));
  }
  if (path === "/giriş") {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  if (!path.startsWith("/panel")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/giris", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  try {
    await jwtVerify(token, secretKey());
    return NextResponse.next();
  } catch {
    const login = new URL("/giris", request.url);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/panel/:path*", "/:slug"],
};
