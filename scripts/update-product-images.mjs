// 상품 이미지 — Naver 한국어 검색 (한국 진짜 이미지)
// 캐시: 같은 쿼리 한 번만 hit, 상품 UUID hash로 풀에서 deterministic 선택
// 실행: node scripts/update-product-images.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const NAVER_ID = process.env.NAVER_CLIENT_ID;
const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
if (!NAVER_ID || !NAVER_SECRET) {
  console.error("NAVER_CLIENT_ID/SECRET 누락");
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const KEYWORD_MAP = [
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

const CATEGORY_MAP = {
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

function normalize(url) {
  if (!url) return null;
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) {
    // 모든 http → https 시도 (대부분 도메인이 https 지원)
    return url.replace(/^http:\/\//, "https://");
  }
  return null;
}

const cache = new Map();
async function naverSearch(query) {
  if (cache.has(query)) return cache.get(query);
  const url = `https://openapi.naver.com/v1/search/image.json?query=${encodeURIComponent(query)}&display=30&sort=sim`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_ID,
      "X-Naver-Client-Secret": NAVER_SECRET,
    },
  });
  if (!res.ok) {
    console.error(`Naver "${query}": HTTP ${res.status}`);
    cache.set(query, []);
    return [];
  }
  const json = await res.json();
  const items = (json.items || [])
    .map((it) => normalize(it.link))
    .filter(Boolean);
  cache.set(query, items);
  return items;
}

console.log("Naver 한국어 검색으로 상품 이미지 재매핑\n");

const { data: products } = await sb
  .from("products")
  .select("id, name, store:stores(category)");

if (!products?.length) {
  console.error("상품 없음");
  process.exit(1);
}

const uniqueQueries = [...new Set(products.map(getQuery))];
console.log(`unique 검색어 ${uniqueQueries.length}개 병렬 hit...`);
await Promise.all(uniqueQueries.map(naverSearch));
console.log("검색 풀 준비됨\n");

const CONCURRENCY = 10;
let done = 0;

for (let i = 0; i < products.length; i += CONCURRENCY) {
  const batch = products.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(async (p) => {
      const q = getQuery(p);
      const urls = cache.get(q) || [];
      if (!urls.length) {
        console.log(`  ⚠️  결과 없음: ${p.name} (q="${q}")`);
        return;
      }
      const url = urls[hashUuid(p.id) % urls.length];
      const { error } = await sb.from("products").update({ image_url: url }).eq("id", p.id);
      if (!error) done++;
    }),
  );
  process.stdout.write(`  ${done}/${products.length}\r`);
}
console.log(`  ${done}/${products.length}\n✅ 완료`);

console.log("\n검색어 분포:");
const dist = {};
for (const p of products) dist[getQuery(p)] = (dist[getQuery(p)] || 0) + 1;
for (const [q, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}x  "${q}"`);
}
