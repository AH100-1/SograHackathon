/**
 * SSRF 방어: 사용자가 등록하는 외부 URL을 화이트리스트에 있는 호스트로만 제한.
 * 내부 IP·localhost·메타데이터 IP 차단.
 */
const DEFAULT_ALLOWED = [
  "images.unsplash.com",
  "cdn.pixabay.com",
  "picsum.photos",
  "supabase.co",
];

function getAllowedHosts(): string[] {
  const env = process.env.ALLOWED_IMAGE_HOSTS;
  if (!env) return DEFAULT_ALLOWED;
  return env.split(",").map((s) => s.trim()).filter(Boolean);
}

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./, // AWS metadata
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /\.local$/i,
  /\.internal$/i,
];

export function isUrlSafe(input: string): { ok: boolean; reason?: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "unsupported_protocol" };
  }

  const host = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(host))) {
    return { ok: false, reason: "internal_host_blocked" };
  }

  const allowed = getAllowedHosts();
  const ok = allowed.some(
    (a) => host === a.toLowerCase() || host.endsWith(`.${a.toLowerCase()}`),
  );

  if (!ok) return { ok: false, reason: "host_not_allowed" };
  return { ok: true };
}
