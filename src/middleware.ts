import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname === "/admin";

  // Alias /admin -> redirect to /dashboard
  if (isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Il layout generale deve sapere se e' la tessera del cliente (ha icona e manifest propri)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://taaaac.eu https://*.taaaac.eu https://*.vercel.app http://localhost:*;"
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin", "/admin/:path*", "/tessera/:path*"],
};
