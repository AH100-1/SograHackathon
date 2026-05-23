/**
 * SSRF 방어 (강화판)
 * - URL 파싱 후 hostname/protocol 검증
 * - 사설/링크로컬/메타데이터 IPv4·IPv6 대역 차단 (literal + DNS 해석 결과)
 * - 화이트리스트 도메인만 통과
 * - https 프로토콜만 허용 (file/ftp/data/javascript 등 비정상 스킴 차단)
 * - isUrlSafeWithDns(): DNS 해석까지 검증 (서버에서 실제 fetch 직전 사용)
 * - followRedirectsSafely(): 리다이렉트 체인의 모든 hop 검증
 */
import { promises as dns } from "node:dns";
import net from "node:net";

const DEFAULT_ALLOWED = [
  "images.unsplash.com",
  "cdn.pixabay.com",
  "picsum.photos",
  "supabase.co",
];

function getAllowedHosts(): string[] {
  const env = process.env.ALLOWED_IMAGE_HOSTS;
  if (!env) return DEFAULT_ALLOWED;
  return env
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// ─── 호스트명 패턴 (literal IP가 아니라 hostname으로 들어온 케이스) ───
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /\.localhost$/i,
  /\.local$/i,
  /\.internal$/i,
];

// ─── IPv4 차단 대역 ───
function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;

  return (
    a === 10 ||                              // 10.0.0.0/8 (사설)
    (a === 172 && b >= 16 && b <= 31) ||     // 172.16.0.0/12 (사설)
    (a === 192 && b === 168) ||              // 192.168.0.0/16 (사설)
    a === 127 ||                             // 127.0.0.0/8 (loopback)
    a === 0 ||                               // 0.0.0.0/8
    (a === 169 && b === 254) ||              // 169.254.0.0/16 (link-local + AWS metadata)
    (a === 100 && b >= 64 && b <= 127) ||    // 100.64.0.0/10 (Carrier-grade NAT)
    a >= 224                                 // 224.0.0.0/4 멀티캐스트 + 240+ 예약
  );
}

// ─── IPv6 차단 대역 ───
function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::" ||
    lower === "::1" ||                      // loopback
    lower.startsWith("fc") ||               // fc00::/7 ULA
    lower.startsWith("fd") ||
    lower.startsWith("fe80:") ||            // link-local
    lower.startsWith("ff") ||               // 멀티캐스트
    lower.startsWith("::ffff:")             // IPv4-mapped (개별 IPv4도 검증)
  );
}

function isPrivateIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isBlockedIPv4(ip);
  if (v === 6) {
    if (isBlockedIPv6(ip)) return true;
    // IPv4-mapped (::ffff:127.0.0.1) — IPv4 부분도 검증
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped && isBlockedIPv4(mapped[1])) return true;
  }
  return false;
}

// ─── 화이트리스트 매칭 ───
function isAllowedHost(host: string): boolean {
  const allowed = getAllowedHosts();
  return allowed.some((a) => host === a || host.endsWith(`.${a}`));
}

// ─── 동기 검증 (DNS 호출 안 함) ───
export function isUrlSafe(input: string): { ok: boolean; reason?: string } {
  if (!input || typeof input !== "string") {
    return { ok: false, reason: "invalid_url" };
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  // 1) 프로토콜 검증 — https만 허용 (file/ftp/data/javascript/blob 등 모두 차단)
  if (url.protocol !== "https:") {
    return { ok: false, reason: "unsupported_protocol" };
  }

  // 2) Credential URL 차단 (user:pass@host)
  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url_blocked" };
  }

  const host = url.hostname.toLowerCase();

  // 3) hostname 패턴 차단 (localhost, *.local 등)
  if (BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(host))) {
    return { ok: false, reason: "internal_host_blocked" };
  }

  // 4) 리터럴 IP면 IP 대역 검증
  if (net.isIP(host) && isPrivateIp(host)) {
    return { ok: false, reason: "private_ip_blocked" };
  }

  // 5) 화이트리스트 매칭
  if (!isAllowedHost(host)) {
    return { ok: false, reason: "host_not_allowed" };
  }

  return { ok: true };
}

// ─── DNS 해석까지 검증 (실제 fetch 직전 사용) ───
export async function isUrlSafeWithDns(
  input: string,
): Promise<{ ok: boolean; reason?: string }> {
  const basic = isUrlSafe(input);
  if (!basic.ok) return basic;

  const url = new URL(input);
  const host = url.hostname.toLowerCase();

  if (net.isIP(host)) return basic; // 이미 IP 검증됨

  // DNS rebinding 방어: A/AAAA 레코드가 사설 IP면 차단
  try {
    const addrs = await dns.lookup(host, { all: true, verbatim: true });
    for (const { address } of addrs) {
      if (isPrivateIp(address)) {
        return { ok: false, reason: "dns_resolves_to_private_ip" };
      }
    }
  } catch {
    return { ok: false, reason: "dns_lookup_failed" };
  }

  return { ok: true };
}

// ─── 리다이렉트 체인 모든 hop 검증 후 fetch ───
export async function fetchWithRedirectGuard(
  input: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = input;
  for (let i = 0; i <= maxRedirects; i++) {
    const safe = await isUrlSafeWithDns(currentUrl);
    if (!safe.ok) {
      throw new Error(`ssrf_blocked: ${safe.reason} at hop ${i} (${currentUrl})`);
    }
    const res = await fetch(currentUrl, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      currentUrl = new URL(loc, currentUrl).toString();
      continue;
    }
    return res;
  }
  throw new Error("ssrf_blocked: too_many_redirects");
}
