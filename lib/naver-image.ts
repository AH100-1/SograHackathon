// Naver 이미지 검색 (서버 전용) — 진짜 한국 이미지
// 상품명+카테고리로 한국어 검색 → 첫 이미지 URL

const KEYWORD_MAP: { kw: string[]; q: string }[] = [
  { kw: ["파전"], q: "한국 파전 부침개" },
  { kw: ["전", "부침개"], q: "한국 전 부침개" },
  { kw: ["잡채"], q: "한국 잡채" },
  { kw: ["비빔밥"], q: "한국 비빔밥" },
  { kw: ["불고기"], q: "한국 불고기" },
  { kw: ["갈비"], q: "한국 갈비" },
  { kw: ["국수", "냉면", "칼국수"], q: "한국 국수" },
  { kw: ["삼겹살"], q: "한국 삼겹살" },
  { kw: ["떡볶이"], q: "떡볶이" },
  { kw: ["김밥"], q: "한국 김밥" },
  { kw: ["만두"], q: "한국 만두" },
  { kw: ["호두과자", "호두"], q: "호두과자 천안" },
  { kw: ["막걸리"], q: "한국 막걸리" },
  { kw: ["인삼차"], q: "인삼차" },
  { kw: ["인삼"], q: "인삼" },
  { kw: ["고추장"], q: "한국 고추장" },
  { kw: ["된장", "장류"], q: "한국 된장" },
  { kw: ["굴젓"], q: "굴젓 젓갈" },
  { kw: ["젓갈"], q: "한국 젓갈" },
  { kw: ["김치"], q: "한국 김치" },
  { kw: ["한과", "약과", "강정"], q: "한국 전통 한과" },
  { kw: ["떡", "다과"], q: "한국 전통 떡" },
  { kw: ["꿀"], q: "천연 꿀" },
  { kw: ["딸기잼", "잼"], q: "수제 딸기잼" },
  { kw: ["차"], q: "전통 차" },
  { kw: ["꽃", "화훼", "다발"], q: "꽃 다발" },
  { kw: ["한우", "정육", "소고기"], q: "한우 정육" },
  { kw: ["건어물"], q: "건어물 모듬" },
  { kw: ["오징어"], q: "건오징어" },
  { kw: ["멸치"], q: "건멸치" },
  { kw: ["빵", "베이커리"], q: "수제 빵 베이커리" },
  { kw: ["과자", "쿠키"], q: "수제 쿠키" },
  { kw: ["밤"], q: "공주 밤 알밤" },
  { kw: ["반찬"], q: "한국 정성 반찬" },
  { kw: ["분식"], q: "한국 분식" },
  { kw: ["양조", "주류", "전통주"], q: "한국 전통주" },
];

const CATEGORY_MAP: Record<string, string> = {
  "전통과자": "한국 전통 한과 떡",
  "장·반찬": "한국 반찬 정성",
  "한식": "한식 한정식 도시락",
  "분식": "한국 분식 떡볶이",
  "정육": "한우 정육 선물",
  "수산": "건어물 젓갈",
  "농산물": "한국 신선 농산물",
  "전통공예": "한국 전통 공예품",
  "화훼": "꽃 다발",
  "특산물": "대전 특산물",
  "수제빵": "수제 빵 베이커리",
  "기타": "한국 전통 음식 선물",
};

function buildQuery(name: string, category?: string | null): string {
  for (const { kw, q } of KEYWORD_MAP) {
    if (kw.some((k) => name.includes(k))) return q;
  }
  return (category && CATEGORY_MAP[category]) || CATEGORY_MAP["기타"];
}

/**
 * HTTP → HTTPS 강제 (mixed content 차단 회피)
 * 일부 도메인은 HTTPS 미지원 → null
 */
function normalize(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) {
    // 주요 도메인은 HTTPS 정상 지원
    const safeHttps = /^(imgnews\.naver\.|.*\.daumcdn\.|.*\.pstatic\.|.*\.kakaocdn\.|.*\.naver\.)/i;
    const httpsUrl = url.replace(/^http:\/\//, "https://");
    if (safeHttps.test(httpsUrl.replace(/^https:\/\//, ""))) return httpsUrl;
    // 그 외는 fallback 위해 null
    return null;
  }
  return null;
}

/**
 * 상품명+카테고리로 Naver 검색 → 사용 가능한 이미지 URL 반환.
 * 실패 시 null.
 */
export async function fetchNaverImage(
  name: string,
  category?: string | null,
): Promise<string | null> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return null;

  const query = buildQuery(name, category);
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image.json?query=${encodeURIComponent(query)}&display=20&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": id,
          "X-Naver-Client-Secret": secret,
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: { link: string }[] };
    const items = json.items || [];
    // 첫 https 변환 가능한 URL 반환
    for (const item of items) {
      const url = normalize(item.link);
      if (url) return url;
    }
    return null;
  } catch {
    return null;
  }
}
