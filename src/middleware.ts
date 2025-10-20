import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const url = req.nextUrl;

  if (url.pathname.startsWith("/admin")) {
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?e=forbidden", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
