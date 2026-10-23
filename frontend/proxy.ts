import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth protection — admin only
  if (pathname.startsWith("/tip/admin") || pathname.startsWith("/api/admin")) {
    const sessionToken = request.cookies.get("next-auth.session-token")?.value
      || request.cookies.get("__Secure-next-auth.session-token")?.value;
    if (!sessionToken) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      }
      const signInUrl = new URL("/tip/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  const response = NextResponse.next();

  return response;
}

export const config = {
  // Only run on admin paths — never on JWKS / auth / static, so CDP fetches can't get a 302
  matcher: ["/tip/admin/:path*", "/api/admin/:path*"],
};
