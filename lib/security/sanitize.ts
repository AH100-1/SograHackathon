// Vercel Fluid Compute에서 isomorphic-dompurify(jsdom) ESM 충돌 회피 → 자체 구현
// 입력 데이터가 plain text라서 deep sanitize 불필요, 위험 태그/속성만 차단.

const DANGEROUS_BLOCK = /<(script|style|iframe|object|embed|link|meta|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_SELF = /<(script|style|iframe|object|embed|link|meta|form)\b[^>]*\/?>/gi;
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_SCHEME = /javascript:/gi;

const ALL_TAGS = /<[^>]*>/g;

/**
 * 리치 HTML 입력에서 위험 요소만 제거 (허용 태그는 남김).
 * 리뷰·상품 설명 등에 적용.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  let s = String(dirty);
  s = s.replace(DANGEROUS_BLOCK, "");
  s = s.replace(DANGEROUS_SELF, "");
  s = s.replace(EVENT_ATTR, "");
  s = s.replace(JS_SCHEME, "");
  return s;
}

/** 일반 텍스트 입력 — 모든 태그 제거 */
export function stripHtml(dirty: string): string {
  if (!dirty) return "";
  return String(dirty).replace(ALL_TAGS, "");
}
