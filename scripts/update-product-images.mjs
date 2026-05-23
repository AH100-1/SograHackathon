// 상품별 이미지를 카테고리 + 상품명 키워드에 맞게 갱신
// 실행: node scripts/update-product-images.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// 카테고리별 Unsplash photo ID 풀 — 모두 200 OK 검증됨 (404 ID 14개 제거)
const POOLS = {
  "전통과자": [
    "photo-1606312619070-d48b4c652a52",
    "photo-1558961363-fa8fdf82db35",
    "photo-1551024506-0bccd828d307",
  ],
  "장·반찬": [
    "photo-1556910103-1c02745aae4d",
    "photo-1601628828688-632f38a5a7d0",
    "photo-1611784728558-6c7d9b409cdf",
  ],
  "한식": [
    "photo-1546069901-ba9599a7e63c",
    "photo-1565299585323-38d6b0865b47",
    "photo-1604908176997-125f25cc6f3d",
    "photo-1626804475297-41608ea09aeb",
    "photo-1532347922424-c652d9b7208e",
  ],
  "분식": [
    "photo-1535473895227-bdecb20fb157",
    "photo-1546069901-ba9599a7e63c",
  ],
  "정육": [
    "photo-1607623814075-e51df1bdc82f",
    "photo-1551028719-00167b16eac5",
    "photo-1588168333986-5078d3ae3976",
    "photo-1586190848861-99aa4a171e90",
  ],
  "수산": [
    "photo-1565299624946-b28f40a0ae38",
    "photo-1599487488170-d11ec9c172f0",
  ],
  "농산물": [
    "photo-1542838132-92c53300491e",
    "photo-1518977676601-b53f82aba655",
    "photo-1457449940276-e8deed18bfff",
  ],
  "전통공예": [
    "photo-1600857544200-b2f666a9a2ec",
    "photo-1603565816030-6b389eeb23cb",
    "photo-1610701596007-11502861dcfa",
  ],
  "화훼": [
    "photo-1487530811176-3780de880c2d",
    "photo-1490750967868-88aa4486c946",
    "photo-1531058020387-3be344556be6",
    "photo-1561181286-d3fee7d55364",
  ],
  "특산물": [
    "photo-1587049352846-4a222e784d38",
    "photo-1505252585461-04db1eb84625",
  ],
  "수제빵": [
    "photo-1509440159596-0249088772ff",
    "photo-1567306301408-9b74779a11af",
    "photo-1608198093002-ad4e005484ec",
    "photo-1555507036-ab1f4038808a",
  ],
  "기타": [
    "photo-1606312619070-d48b4c652a52",
    "photo-1558961363-fa8fdf82db35",
    "photo-1505252585461-04db1eb84625",
  ],
};

// 상품명 키워드 → 검증된 ID만 사용
const KEYWORD_OVERRIDE = [
  { kw: ["꿀"], id: "photo-1587049352846-4a222e784d38" },
  { kw: ["떡", "한과", "약과", "강정", "다과"], id: "photo-1606312619070-d48b4c652a52" },
  { kw: ["김치"], id: "photo-1611784728558-6c7d9b409cdf" },
  { kw: ["고추장", "장류", "된장"], id: "photo-1601628828688-632f38a5a7d0" },
  { kw: ["젓갈", "굴젓"], id: "photo-1556910103-1c02745aae4d" },
  { kw: ["호두", "호두과자"], id: "photo-1558961363-fa8fdf82db35" },
  { kw: ["인삼", "차"], id: "photo-1576092768241-dec231879fc3" },
  { kw: ["막걸리", "주류", "양조"], id: "photo-1576092768241-dec231879fc3" },
  { kw: ["꽃", "화훼", "다발"], id: "photo-1487530811176-3780de880c2d" },
  { kw: ["한우", "정육", "소고기"], id: "photo-1607623814075-e51df1bdc82f" },
  { kw: ["건어물", "오징어", "멸치"], id: "photo-1565299624946-b28f40a0ae38" },
  { kw: ["딸기", "잼"], id: "photo-1505252585461-04db1eb84625" },
  { kw: ["빵", "베이커리"], id: "photo-1509440159596-0249088772ff" },
  { kw: ["과자", "쿠키"], id: "photo-1551024506-0bccd828d307" },
  { kw: ["밤", "공주밤"], id: "photo-1606312619070-d48b4c652a52" },
];

function hashUuid(uuid) {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickImage(product) {
  const name = product.name || "";
  // 1) 키워드 우선
  for (const { kw, id } of KEYWORD_OVERRIDE) {
    if (kw.some((k) => name.includes(k))) return id;
  }
  // 2) 카테고리 풀에서 deterministic 선택
  const cat = product.store?.category || "기타";
  const pool = POOLS[cat] || POOLS["기타"];
  return pool[hashUuid(product.id) % pool.length];
}

console.log("📷 상품 이미지 재매핑 시작\n");

const { data: products } = await sb
  .from("products")
  .select("id, name, store:stores(category)");

const updates = [];
const stat = {};
for (const p of products || []) {
  const photoId = pickImage(p);
  const url = `https://images.unsplash.com/${photoId}?w=800&q=80&auto=format&fit=crop`;
  updates.push({ id: p.id, image_url: url });
  stat[photoId] = (stat[photoId] || 0) + 1;
}

console.log(`총 ${updates.length}개 상품 업데이트 중...`);

let done = 0;
for (const u of updates) {
  const { error } = await sb.from("products").update({ image_url: u.image_url }).eq("id", u.id);
  if (error) console.error("  ❌", u.id, error.message);
  else done++;
  if (done % 20 === 0) process.stdout.write(`  ${done}/${updates.length}\r`);
}
console.log(`  ${done}/${updates.length}\n`);

console.log("📊 이미지별 사용 횟수 (top 8):");
for (const [id, n] of Object.entries(stat).sort((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`  ${n}x  ${id}`);
}
console.log(`\n✅ 이미지 종류: ${Object.keys(stat).length}개 (이전엔 ~12개)`);
