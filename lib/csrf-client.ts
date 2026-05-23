"use client";

/** 브라우저에서 CSRF 쿠키 값을 읽어 헤더에 실어 보내기 위한 헬퍼 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)sogra_csrf=([^;]+)/);
  return match?.[1] || null;
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getCsrfToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("x-csrf-token", token);
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}
