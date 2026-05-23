// SBA storeListInRadius → 충남/대전 가게 pull → Supabase insert
// 실행: node scripts/fetch-sba-stores.mjs

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

process.loadEnvFile(".env.local");

const SBA_KEY = process.env.SBA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SBA_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ .env.local 에 SBA_API_KEY / SUPABASE_URL / SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// 충남·대전 주요 좌표
const SPOTS = [
  { name: "대전 시청",   cx: 127.3845, cy: 36.3504, r: 1000 },
  { name: "대전 은행동", cx: 127.4275, cy: 36.3286, r: 800 },
  { name: "천안 시청",   cx: 127.1471, cy: 36.8151, r: 1000 },
  { name: "공주 원도심", cx: 127.1192, cy: 36.4467, r: 1000 },
  { name: "논산 시청",   cx: 127.0985, cy: 36.1872, r: 1000 },
  { name: "보령 시청",   cx: 126.6128, cy: 36.3334, r: 1000 },
  { name: "부여 부소산", cx: 126.9097, cy: 36.2756, r: 1000 },
  { name: "서산 시청",   cx: 126.4502, cy: 36.7822, r: 1000 },
  { name: "당진 시청",   cx: 126.6457, cy: 36.8939, r: 1000 },
  { name: "아산 온양",   cx: 127.0046, cy: 36.7900, r: 1000 },
];

// 명백히 선물용 아닌 업종 제외
const EXCLUDE_KEYWORDS = [
  "주점", "유흥", "단란",
  "주유소", "세차", "자동차", "타이어", "부동산",
  "이미용", "이용", "미용", "마사지", "헬스", "노래", "PC방", "당구",
  "은행", "증권", "보험", "병원", "의원", "약국",
  "학원", "교습소", "독서실", "어린이집",
  "법무", "회계", "컨설팅", "부동산",
];

// 선물 후보로 포함할 중분류 키워드 (소매 대분류 안에서만)
const RETAIL_GIFT_PATTERNS = /음식|식품|농산|특산|기념|공예|차|화훼/;

function shouldInclude(item) {
  const lcls = item.indsLclsNm || "";   // 대분류 (음식 / 소매 / 수리·개인 / ...)
  const mcls = item.indsMclsNm || "";   // 중분류 (한식 / 카페 / ...)
  const scls = item.indsSclsNm || "";   // 소분류
  const full = `${lcls} ${mcls} ${scls}`;

  if (EXCLUDE_KEYWORDS.some((k) => full.includes(k))) return false;

  // 음식 대분류 → 한식, 일식, 카페, 제과, 떡 등 모두 포함
  if (lcls === "음식") return true;

  // 소매 대분류 → 식품·특산·공예·차 관련만
  if (lcls === "소매" && RETAIL_GIFT_PATTERNS.test(mcls + scls)) return true;

  return false;
}

async function fetchRadius(spot) {
  const url = "http://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius";
  const params = new URLSearchParams({
    serviceKey: SBA_KEY,
    type: "json",
    radius: String(spot.r),
    cx: String(spot.cx),
    cy: String(spot.cy),
    numOfRows: "500",
    pageNo: "1",
  });
  const res = await fetch(`${url}?${params}`);
  if (!res.ok) throw new Error(`SBA ${spot.name}: ${res.status}`);
  const json = await res.json();
  if (json.header?.resultCode !== "00") {
    console.warn(`  ⚠️  ${spot.name}: ${json.header?.resultMsg}`);
    return [];
  }
  return json.body?.items || [];
}

function categoryOf(item) {
  const m = item.indsMclsNm || "";
  const s = item.indsSclsNm || "";
  const full = m + s;
  if (/제과|제빵|떡|한과/.test(full)) return "식품·과자";
  if (/한식|향토/.test(full)) return "식품·한식";
  if (/카페|커피|비알코올|차/.test(full)) return "음료·카페";
  if (/일식|중식|양식|아시아/.test(full)) return "식품·외식";
  if (/농산|특산/.test(full)) return "식품·특산";
  if (/공예|도자|화훼/.test(full)) return "공예";
  if (/음식|식품/.test(full)) return "식품·기타";
  return "식품·기타";
}

function tagsOf(item, category) {
  const base = ["대전충청", "로컬"];
  if (category.includes("한식")) base.push("전통", "부모님", "명절");
  if (category.includes("과자")) base.push("간식", "달달함", "선물");
  if (category.includes("차")) base.push("건강", "차", "부모님");
  if (category.includes("전통")) base.push("전통", "특산물", "명절");
  if (category.includes("공예")) base.push("공예", "기념일", "수제");
  return [...new Set(base)];
}

function priceOf(category) {
  const ranges = {
    "식품·한식":  [15000, 45000],
    "식품·과자":  [8000,  25000],
    "건강·차":    [12000, 35000],
    "식품·전통":  [10000, 30000],
    "공예":        [15000, 50000],
    "식품·기타":  [8000,  22000],
  };
  const [lo, hi] = ranges[category] || [10000, 25000];
  return Math.round((lo + Math.random() * (hi - lo)) / 1000) * 1000;
}

const IMAGE_POOL = {
  "식품·한식":  ["photo-1583224994076-ae9c4bb0e8e3", "photo-1604908554007-1aaf3e51b8d2"],
  "식품·과자":  ["photo-1558961363-fa8fdf82db35", "photo-1606312619070-d48b4c652a52", "photo-1605478371310-89f481d23080"],
  "건강·차":    ["photo-1576092768241-dec231879fc3", "photo-1587049352846-4a222e784d38"],
  "식품·전통":  ["photo-1597528380177-f23ea0bdb18b", "photo-1556910103-1c02745aae4d", "photo-1587049352846-4a222e784d38"],
  "공예":        ["photo-1600857544200-b2f666a9a2ec", "photo-1605478371310-89f481d23080"],
  "식품·기타":  ["photo-1606312619070-d48b4c652a52", "photo-1558961363-fa8fdf82db35"],
};
function imageOf(category) {
  const pool = IMAGE_POOL[category] || IMAGE_POOL["식품·기타"];
  const id = pool[Math.floor(Math.random() * pool.length)];
  return `https://images.unsplash.com/${id}?w=600`;
}

function productNameOf(storeName, category) {
  const suffix = {
    "식품·한식":  "정성 선물 세트",
    "식품·과자":  "수제 과자 세트",
    "건강·차":    "프리미엄 티 세트",
    "식품·전통":  "전통 특산 세트",
    "공예":        "장인 공예 컬렉션",
    "식품·기타":  "시그니처 선물 박스",
  };
  return `${storeName} ${suffix[category] || "선물 세트"}`;
}

function descOf(storeName, category, addr) {
  const lines = {
    "식품·한식":  `${addr.split(" ").slice(0,2).join(" ")}의 ${storeName}이 정성껏 준비한 한식 선물 세트. 명절·부모님 선물 추천.`,
    "식품·과자":  `${storeName}에서 손수 만든 전통 과자. 갓 구워낸 식감과 자연 단맛.`,
    "건강·차":    `${storeName}의 시그니처 차. 우려낼수록 깊어지는 풍미.`,
    "식품·전통":  `${storeName}이 자랑하는 대전충청 특산물. 6개월 이상 자연 숙성한 진짜 맛.`,
    "공예":        `${storeName} 장인의 손길이 담긴 수제 공예품. 단 하나뿐인 기념일 선물.`,
    "식품·기타":  `${storeName}의 로컬 시그니처. 대전충청 정성을 담아 보내드립니다.`,
  };
  return lines[category] || `${storeName}의 정성 가득한 로컬 선물.`;
}

// ─────────────────────────────────────────────
console.log("🚀 SBA API → Supabase 적재 시작\n");

const seen = new Set();
const candidates = [];

for (const spot of SPOTS) {
  process.stdout.write(`📍 ${spot.name} ... `);
  try {
    const items = await fetchRadius(spot);
    let added = 0;
    for (const it of items) {
      if (seen.has(it.bizesNo)) continue;

      const fullCat = `${it.indsLclsNm} ${it.indsMclsNm} ${it.indsSclsNm}`;
      if (EXCLUDE_KEYWORDS.some((k) => fullCat.includes(k))) continue;
      if (!GIFT_KEYWORDS.some((k) => fullCat.includes(k))) continue;
      if (!it.bizesNm || !it.rdnmAdr || !it.lon || !it.lat) continue;

      seen.add(it.bizesNo);
      candidates.push(it);
      added++;
    }
    console.log(`총 ${items.length}개 / 필터 통과 ${added}개`);
  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}

console.log(`\n✨ 후보 가게 ${candidates.length}개 수집`);

// 100개 샘플링 (셔플 후 슬라이스)
const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 100);
console.log(`📦 샘플링 ${shuffled.length}개\n`);

// ─────────────────────────────────────────────
const stores = shuffled.map((it) => ({
  id: randomUUID(),
  name: it.bizesNm.slice(0, 60),
  address: it.rdnmAdr,
  category: categoryOf(it),
  region: "대전충청",
  lat: parseFloat(it.lat),
  lng: parseFloat(it.lon),
  description: `${it.signguNm} ${it.adongNm}의 ${it.indsMclsNm} 전문점.`,
}));

const products = stores.map((s) => ({
  id: randomUUID(),
  store_id: s.id,
  name: productNameOf(s.name, s.category),
  price: priceOf(s.category),
  stock: 30 + Math.floor(Math.random() * 80),
  image_url: imageOf(s.category),
  tags: tagsOf(null, s.category),
  description: descOf(s.name, s.category, s.address),
  is_approved: true,
}));

console.log(`💾 stores ${stores.length}개 insert...`);
const { error: e1 } = await sb.from("stores").insert(stores);
if (e1) {
  console.error("❌ stores insert 실패:", e1.message);
  process.exit(1);
}

console.log(`💾 products ${products.length}개 insert...`);
const { error: e2 } = await sb.from("products").insert(products);
if (e2) {
  console.error("❌ products insert 실패:", e2.message);
  process.exit(1);
}

console.log(`\n✅ 완료! stores ${stores.length} + products ${products.length}`);
console.log("📊 카테고리 분포:");
const dist = {};
for (const s of stores) dist[s.category] = (dist[s.category] || 0) + 1;
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${k}: ${v}`);
}
