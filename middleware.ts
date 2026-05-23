import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ensureCsrfCookie } from "@/lib/security/csrf";

const PROTECTED = ["/cart", "/seller", "/admin"];

export async function middleware(request: NextRequest) {
  try {
    const response = await updateSession(request);
    ensureCsrfCookie(request, response);
    return response;
  } catch {
    // Supabase 초기화 실패(env 미설정 등) 시 보호 경로는 로그인으로 강제 리다이렉트
    const { pathname } = request.nextUrl;
    if (PROTECTED.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
