// src/middleware.ts
// This protects all routes except login/register but allows homepage access

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow access to homepage even when logged in
    if (req.nextUrl.pathname === "/") {
      return NextResponse.next();
    }
    
    // You can add additional logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect all routes except login, register, and homepage
        if (req.nextUrl.pathname.startsWith("/login") || 
            req.nextUrl.pathname.startsWith("/register") ||
            req.nextUrl.pathname === "/") {
          return true; // Allow access to these routes regardless of auth status
        }
        
        // Allow access to specific SVG files in public folder
        if (req.nextUrl.pathname === "/vezir.svg" ||
            req.nextUrl.pathname === "/vezir-inverted.svg" ||
            req.nextUrl.pathname === "/vezir-favicon.svg") {
          return true;
        }
        
        return !!token; // Require auth for all other routes
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};