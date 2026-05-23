// 상품 이미지 — Pexels API로 실제 사진 검색
// 캐시로 카테고리/키워드 풀 한 번씩만 검색 + 상품 UUID hash로 다양화
// 병렬 처리 (concurrency 10)
// 실행: node scripts/update-product-images.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_KEY) {
  console.error("PEXELS_API_KEY 누락");
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// 상품명 키워드 → 영어 검색어 (구체적·matches 우선순위 중요: 위에서부터 첫 매치)
const KEYWORD_MAP = [
  // 더 specific 한 단어가 위로
  { kw: ["떡볶이"], q: "tteokbokki" },
  { kw: ["김밥"], q: "gimbap kimbap" },
  { kw: ["만두"], q: "mandu dumpling" },
  { kw: ["호두과자", "호두"], q: "walnut pastry cookie" },
  { kw: ["막걸리"], q: "makgeolli bottle traditional" },
  { kw: ["인삼차"], q: "ginseng tea cup" },
  { kw: ["인삼"], q: "ginseng root" },
  { kw: ["딸기잼", "잼"], q: "homemade jam jar" },
  { kw: ["딸기"], q: "strawberry fresh" },
  { kw: ["고추장"], q: "gochujang red pepper paste" },
  { kw: ["된장", "장류"], q: "korean soybean paste" },
  { kw: ["굴젓"], q: "oyster jeotgal" },
  { kw: ["젓갈"], q: "korean salted fermented" },
  { kw: ["김치"], q: "kimchi cabbage red" },
  { kw: ["한과", "약과", "강정"], q: "hangwa korean sweets" },
  { kw: ["떡", "다과"], q: "korean rice cake tteok" },
  { kw: ["꿀"], q: "honey jar wooden" },
  { kw: ["차"], q: "tea pot cup asian" },
  { kw: ["꽃", "화훼", "다발"], q: "flower bouquet wrapped" },
  { kw: ["한우", "정육", "소고기"], q: "raw beef marbled steak" },
  { kw: ["건어물"], q: "dried seafood market" },
  { kw: ["오징어"], q: "dried squid" },
  { kw: ["멸치"], q: "dried anchovy" },
  { kw: ["빵", "베이커리"], q: "artisan bread bakery" },
  { kw: ["과자", "쿠키"], q: "cookies plate" },
  { kw: ["밤"], q: "chestnut roasted" },
  { kw: ["반찬"], q: "korean banchan side" },
  { kw: ["분식"], q: "tteokbokki gimbap" },
  { kw: ["양조", "주류", "전통주"], q: "korean alcohol traditional" },
];

// 카테고리 fallback 검색어
const CATEGORY_MAP = {
  "전통과자": "korean rice cake hangwa",
  "장·반찬": "korean banchan side dishes",
  "한식": "korean meal bowl rice",
  "분식": "tteokbokki gimbap",
  "정육": "raw beef marbled",
  "수산": "dried seafood",
  "농산물": "fresh fruit basket",
  "전통공예": "ceramic pottery handmade",
  "화훼": "flower bouquet",
  "특산물": "korean food gift",
  "수제빵": "artisan bread",
  "기타": "korean food",
};

function hashUuid(uuid) {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getQuery(product) {
  const name = product.name || "";
  for (const { kw, q } of KEYWORD_MAP) {
    if (kw.some((k) => name.includes(k))) return q;
  }
  return CATEGORY_MAP[product.store?.category] || CATEGORY_MAP["기타"];
}

// Pexels 검색 (쿼리당 15장 풀)
const cache = new Map();
async function pexelsSearch(query) {
  if (cache.has(query)) return cache.get(query);
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) {
    console.error(`  ❌ Pexels "${query}": HTTP ${res.status}`);
    cache.set(query, []);
    return [];
  }
  const json = await res.json();
  const photos = json.photos || [];
  cache.set(query, photos);
  return photos;
}

function pickPhotoUrl(product, photos) {
  if (!photos.length) return null;
  const idx = hashUuid(product.id) % photos.length;
  return photos[idx].src.large; // 940x650 정도. large2x도 가능
}

// ─────────────────────────────────────────────
console.log("Pexels 검색으로 상품 이미지 재매핑 (병렬)\n");

const { data: products } = await sb
  .from("products")
  .select("id, name, store:stores(category)");

if (!products?.length) {
  console.error("상품 없음");
  process.exit(1);
}

// 1) 모든 unique 쿼리 한 번씩 미리 검색 (병렬)
const uniqueQueries = [...new Set(products.map(getQuery))];
console.log(`unique 검색어 ${uniqueQueries.length}개 병렬 hit...`);
await Promise.all(uniqueQueries.map(pexelsSearch));
console.log("검색 풀 준비됨\n");

// 2) 각 상품에 deterministic 매핑 + DB 업데이트 (병렬 batch)
const CONCURRENCY = 10;
let done = 0;
let mapped = 0;

for (let i = 0; i < products.length; i += CONCURRENCY) {
  const batch = products.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(async (p) => {
      const q = getQuery(p);
      const photos = cache.get(q) || [];
      const url = pickPhotoUrl(p, photos);
      if (!url) {
        console.log(`  ⚠️  사진 없음: ${p.name} (q="${q}")`);
        return;
      }
      const { error } = await sb
        .from("products")
        .update({ image_url: url })
        .eq("id", p.id);
      if (error) console.error("  ❌", p.id, error.message);
      else {
        done++;
        mapped++;
      }
    }),
  );
  process.stdout.write(`  ${done}/${products.length}\r`);
}
console.log(`  ${done}/${products.length}\n`);

console.log(`✅ ${mapped}개 상품 이미지 갱신 (검색어 ${uniqueQueries.length}종)`);
console.log("\n검색어 분포:");
const distQ = {};
for (const p of products) distQ[getQuery(p)] = (distQ[getQuery(p)] || 0) + 1;
for (const [q, n] of Object.entries(distQ).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}x  "${q}"`);
}
