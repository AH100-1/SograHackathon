import { type NextRequest, type NextResponse } from "next/server";

const CSRF_COOKIE = "sogra_csrf";
const CSRF_HEADER = "x-csrf-token";

/** Web Crypto API 로 토큰 생성 (Edge/Node 양쪽 모두 동작) */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison — timing attack 방어 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** double-submit cookie 패턴: 쿠키가 없으면 발급 */
export function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  if (!req.cookies.get(CSRF_COOKIE)) {
    const token = generateToken();
    res.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // JS에서 읽어 헤더로 전송해야 함 (double-submit 원리)
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
}

/** API 라우트에서 호출 — 헤더 토큰과 쿠키 토큰이 일치하는지 확인 */
export function verifyCsrf(req: Request): { ok: boolean; reason?: string } {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  const cookieToken = cookieMatch?.[1];
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return { ok: false, reason: "missing_csrf_token" };
  }
  if (!constantTimeEqual(cookieToken, headerToken)) {
    return { ok: false, reason: "csrf_token_mismatch" };
  }
  return { ok: true };
}

export { CSRF_COOKIE, CSRF_HEADER };
