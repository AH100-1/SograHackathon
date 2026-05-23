// Pexels 이미지 검색 (서버 전용)
// 상품 이름·카테고리로 적합한 사진 1장 URL 반환. 실패 시 null.

const KEYWORD_MAP: { kw: string[]; q: string }[] = [
  { kw: ["떡", "한과", "약과", "강정", "다과"], q: "korean rice cake" },
  { kw: ["김치"], q: "korean kimchi" },
  { kw: ["고추장", "장류", "된장"], q: "korean fermented paste" },
  { kw: ["젓갈", "굴젓"], q: "korean fermented seafood" },
  { kw: ["호두", "호두과자"], q: "walnut cookie" },
  { kw: ["인삼"], q: "ginseng" },
  { kw: ["차"], q: "korean tea" },
  { kw: ["막걸리", "양조", "주류"], q: "korean rice wine" },
  { kw: ["꽃", "화훼", "다발"], q: "flower bouquet" },
  { kw: ["한우", "정육", "소고기"], q: "korean beef" },
  { kw: ["건어물", "오징어", "멸치"], q: "dried fish" },
  { kw: ["딸기", "잼"], q: "strawberry jam" },
  { kw: ["빵", "베이커리"], q: "artisan bread" },
  { kw: ["꿀"], q: "honey jar" },
  { kw: ["과자", "쿠키"], q: "korean cookie" },
  { kw: ["밤"], q: "roasted chestnut" },
  { kw: ["반찬"], q: "korean side dishes" },
  { kw: ["떡볶이"], q: "tteokbokki" },
  { kw: ["김밥"], q: "korean gimbap" },
  { kw: ["만두"], q: "korean dumpling mandu" },
];

const CATEGORY_MAP: Record<string, string> = {
  "전통과자": "korean traditional sweets",
  "장·반찬": "korean side dishes banchan",
  "한식": "korean food traditional",
  "분식": "korean street food tteokbokki",
  "정육": "korean beef hanwoo",
  "수산": "dried seafood market",
  "농산물": "fruit basket farm",
  "전통공예": "korean pottery ceramic",
  "화훼": "flower bouquet",
  "특산물": "korean food gift box",
  "수제빵": "artisan bread bakery",
  "기타": "korean traditional food",
};

function buildQuery(name: string, category?: string | null): string {
  for (const { kw, q } of KEYWORD_MAP) {
    if (kw.some((k) => name.includes(k))) return q;
  }
  return (category && CATEGORY_MAP[category]) || CATEGORY_MAP["기타"];
}

/**
 * 상품 정보로 Pexels 검색해서 사진 1장 URL 반환.
 * 사용자가 이미지 미입력 시 자동 매핑 용도.
 */
export async function fetchPexelsImage(
  name: string,
  category?: string | null,
): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const query = buildQuery(name, category);
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
      {
        headers: { Authorization: key },
        // Vercel function timeout 회피
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      photos?: { src: { large: string } }[];
    };
    const photos = json.photos || [];
    if (!photos.length) return null;
    // 같은 호출 시 매번 다른 사진 — 자연스러움
    const idx = Math.floor(Math.random() * Math.min(photos.length, 10));
    return photos[idx].src.large;
  } catch {
    return null;
  }
}
