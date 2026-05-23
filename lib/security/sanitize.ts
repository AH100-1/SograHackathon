import DOMPurify from "isomorphic-dompurify";

/**
 * 사용자가 입력한 HTML을 안전한 형태로 정제.
 * 리뷰·상품 설명 등에 적용.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

/** 일반 텍스트 입력 (태그 자체 제거) */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
