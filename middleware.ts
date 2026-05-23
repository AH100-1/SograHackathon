import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ensureCsrfCookie } from "@/lib/security/csrf";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  ensureCsrfCookie(request, response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
