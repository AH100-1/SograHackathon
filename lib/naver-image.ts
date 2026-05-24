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

// 음식 핵심 명사 — 첫 단어가 이 중에 있으면 가게 이름이 아니라 핵심 키워드로 간주
const FOOD_KEYWORDS_RE = /떡|한과|약과|강정|김치|반찬|꿀|차|빵|국수|만두|김밥|호두|밤|꽃|특산|젓갈|건어물|장아찌|곡물|채소|과일|한식|분식|정육|한우|수산|공예|화훼|차림/;

// 상품 이름에서 가게 이름·suffix·접미사 제거 → 핵심 음식 키워드만
function cleanProductName(name: string): string {
  let s = String(name || "").trim();
  // suffix 제거 (선물세트, 패키지, 박스, 콤보, 식권, 시그니처 등)
  s = s.replace(/\b(선물\s*세트|선물\s*박스|시그니처|패키지|박스|모듬|컬렉션|기프트|세트|콤보|식권|보따리|모음)\b/g, "");
  s = s.replace(/\s+/g, " ").trim();
  // 첫 단어가 음식 키워드 아니면 가게 이름으로 간주 → 제거
  const words = s.split(/\s+/);
  if (words.length >= 2 && !FOOD_KEYWORDS_RE.test(words[0])) {
    s = words.slice(1).join(" ").trim();
  }
  return s;
}

function buildQuery(name: string, category?: string | null): string {
  // 1) 키워드 명시 매핑 우선
  for (const { kw, q } of KEYWORD_MAP) {
    if (kw.some((k) => name.includes(k))) return q;
  }
  // 2) 상품 이름 정제 + 카테고리 보강
  const cleaned = cleanProductName(name);
  if (cleaned.length >= 2) {
    return cleaned + (category ? ` ${category}` : " 한국");
  }
  // 3) fallback: 카테고리
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
    // filter=large → 큰 사진 우선 (썸네일 품질 ↑)
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image.json?query=${encodeURIComponent(query)}&display=20&sort=sim&filter=large`,
      {
        headers: {
          "X-Naver-Client-Id": id,
          "X-Naver-Client-Secret": secret,
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: { link: string; thumbnail: string }[];
    };
    const items = json.items || [];
    // thumbnail (search.pstatic.net) 우선 — hotlink 허용 + https
    // fallback: 원본 link (referer 차단 위험)
    for (const item of items) {
      const thumb = normalize(item.thumbnail);
      if (thumb) return thumb;
    }
    for (const item of items) {
      const url = normalize(item.link);
      if (url) return url;
    }
    return null;
  } catch {
    return null;
  }
}
