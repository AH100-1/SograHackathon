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

// 대전 전통시장 좌표 (모두 대전광역시 내)
const SPOTS = [
  { name: "중앙시장",       cx: 127.43250, cy: 36.32944, r: 700 },
  { name: "태평시장",       cx: 127.39134, cy: 36.31976, r: 600 },
  { name: "유성5일장",      cx: 127.34036, cy: 36.35457, r: 600 },
  { name: "한민시장",       cx: 127.37960, cy: 36.34870, r: 500 },
  { name: "인동시장",       cx: 127.44030, cy: 36.33010, r: 500 },
  { name: "신도꼼지락시장", cx: 127.42160, cy: 36.37290, r: 500 },
  { name: "도마큰시장",     cx: 127.36770, cy: 36.32710, r: 500 },
  { name: "문창시장",       cx: 127.42180, cy: 36.32010, r: 500 },
  { name: "법동시장",       cx: 127.42520, cy: 36.37120, r: 500 },
  { name: "오류동시장",     cx: 127.41800, cy: 36.33310, r: 500 },
  { name: "자양시장",       cx: 127.43760, cy: 36.36340, r: 500 },
  { name: "우암시장",       cx: 127.43400, cy: 36.34380, r: 500 },
];

// 전통시장 가게답지 않은 업종 제외
const NEGATIVE = [
  "카페", "커피", "비알코올",
  "일식", "중식", "양식", "아시아", "이태리", "이탈", "프렌치",
  "치킨", "피자", "햄버거", "패스트", "패밀리",
  "주점", "유흥", "단란",
  "주유소", "세차", "자동차", "타이어", "부동산",
  "이미용", "이용", "미용", "마사지", "헬스", "노래", "PC방", "당구",
  "은행", "증권", "보험", "병원", "의원", "약국",
  "학원", "교습소", "독서실", "어린이집",
  "법무", "회계", "컨설팅",
];

// 전통시장 분위기 가게만 통과 (대·중·소분류 어디든 포함)
const POSITIVE = [
  "한식", "향토", "한정식",
  "분식", "기타 간이", "김밥", "만두", "떡", "한과", "강정", "약과", "전",
  "김치", "반찬", "장류", "젓갈", "절임",
  "농산", "청과", "수산", "정육", "축산", "건어물", "곡물",
  "특산", "음식료", "식료품",
  "제과", "제빵", "베이커리",
  "공예", "도자", "한복", "자수", "수예", "전통",
  "꽃", "화훼",
];

function shouldInclude(item) {
  const full = `${item.indsLclsNm || ""} ${item.indsMclsNm || ""} ${item.indsSclsNm || ""}`;
  if (NEGATIVE.some((k) => full.includes(k))) return false;
  return POSITIVE.some((k) => full.includes(k));
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
  const full = `${item.indsMclsNm || ""} ${item.indsSclsNm || ""}`;
  if (/떡|한과|강정|약과/.test(full)) return "전통과자";
  if (/제과|제빵|베이커리/.test(full)) return "수제빵";
  if (/김치|반찬|장류|젓갈|절임/.test(full)) return "장·반찬";
  if (/한식|향토|한정식/.test(full)) return "한식";
  if (/분식|김밥|만두|간이/.test(full)) return "분식";
  if (/정육|축산/.test(full)) return "정육";
  if (/수산|건어물/.test(full)) return "수산";
  if (/청과|농산|곡물/.test(full)) return "농산물";
  if (/공예|도자|한복|자수|수예/.test(full)) return "전통공예";
  if (/꽃|화훼/.test(full)) return "화훼";
  if (/특산|식료품|음식료/.test(full)) return "특산물";
  return "기타";
}


function priceOf(category) {
  const ranges = {
    "전통과자": [8000,  25000],
    "수제빵":    [7000,  18000],
    "장·반찬":  [10000, 30000],
    "한식":      [15000, 40000],
    "분식":      [6000,  15000],
    "정육":      [20000, 60000],
    "수산":      [15000, 50000],
    "농산물":    [10000, 30000],
    "전통공예":  [15000, 60000],
    "화훼":      [12000, 35000],
    "특산물":    [12000, 35000],
    "기타":      [8000,  22000],
  };
  const [lo, hi] = ranges[category] || [10000, 25000];
  return Math.round((lo + Math.random() * (hi - lo)) / 1000) * 1000;
}

const IMAGE_POOL = {
  "전통과자": ["photo-1558961363-fa8fdf82db35", "photo-1606312619070-d48b4c652a52", "photo-1605478371310-89f481d23080"],
  "수제빵":    ["photo-1509440159596-0249088772ff", "photo-1567306301408-9b74779a11af"],
  "장·반찬":  ["photo-1604908554007-1aaf3e51b8d2", "photo-1556910103-1c02745aae4d"],
  "한식":      ["photo-1583224994076-ae9c4bb0e8e3", "photo-1546069901-ba9599a7e63c"],
  "분식":      ["photo-1535473895227-bdecb20fb157", "photo-1546069901-ba9599a7e63c"],
  "정육":      ["photo-1607623814075-e51df1bdc82f", "photo-1551028719-00167b16eac5"],
  "수산":      ["photo-1565299624946-b28f40a0ae38", "photo-1559737558-2f5a35f4523d"],
  "농산물":    ["photo-1542838132-92c53300491e", "photo-1518977676601-b53f82aba655"],
  "전통공예":  ["photo-1600857544200-b2f666a9a2ec", "photo-1605478371310-89f481d23080"],
  "화훼":      ["photo-1487530811176-3780de880c2d", "photo-1490750967868-88aa4486c946"],
  "특산물":    ["photo-1597528380177-f23ea0bdb18b", "photo-1587049352846-4a222e784d38"],
  "기타":      ["photo-1606312619070-d48b4c652a52", "photo-1558961363-fa8fdf82db35"],
};
function imageOf(category) {
  const pool = IMAGE_POOL[category] || IMAGE_POOL["식품·기타"];
  const id = pool[Math.floor(Math.random() * pool.length)];
  return `https://images.unsplash.com/${id}?w=600`;
}

function productNameOf(storeName, category) {
  const suffix = {
    "전통과자": "수제 한과 선물 세트",
    "수제빵":    "이른 아침 수제빵 박스",
    "장·반찬":  "엄마손 반찬 선물 세트",
    "한식":      "정성 한식 패키지",
    "분식":      "시장표 분식 콤보",
    "정육":      "프리미엄 한우 선물 세트",
    "수산":      "건어물·젓갈 모듬",
    "농산물":    "제철 농산물 박스",
    "전통공예":  "장인의 수제 공예품",
    "화훼":      "꽃과 함께하는 마음 한 다발",
    "특산물":    "대전 특산 선물 박스",
    "기타":      "전통시장 시그니처 박스",
  };
  return `${storeName} ${suffix[category] || "선물 세트"}`;
}

function tagsOf(_item, category) {
  const base = ["대전", "전통시장", "로컬"];
  const extra = {
    "전통과자": ["전통", "부모님", "명절", "달달함"],
    "수제빵":    ["수제", "간식", "친구"],
    "장·반찬":  ["반찬", "엄마손", "부모님", "전통"],
    "한식":      ["한식", "부모님", "명절", "정성"],
    "분식":      ["간식", "친구", "추억"],
    "정육":      ["한우", "명절", "부모님"],
    "수산":      ["젓갈", "건어물", "부모님", "전통"],
    "농산물":    ["제철", "건강", "부모님"],
    "전통공예":  ["공예", "수제", "기념일"],
    "화훼":      ["꽃", "기념일", "연인"],
    "특산물":    ["특산", "전통", "명절"],
    "기타":      ["시장", "정성"],
  };
  return [...new Set([...base, ...(extra[category] || [])])];
}

function descOf(storeName, category, addr) {
  const region = addr.split(" ").slice(0, 3).join(" ");
  const lines = {
    "전통과자": `${region}의 ${storeName}이 손수 빚은 떡·한과 세트. 명절·부모님 선물에 정성을 담아.`,
    "수제빵":    `${storeName}에서 매일 아침 굽는 수제빵 모음. 방부제 없는 솔직한 맛.`,
    "장·반찬":  `${storeName}의 김치·장아찌·젓갈 모듬. 엄마손 반찬 그대로 댁으로.`,
    "한식":      `${region}의 ${storeName}이 차려내는 정통 한식 패키지. 가족 모임·명절 추천.`,
    "분식":      `${storeName}의 인기 분식 메뉴 세트. 시장에서 먹던 그 추억의 맛.`,
    "정육":      `${storeName}이 직접 고른 프리미엄 한우. 명절 선물의 정석.`,
    "수산":      `${storeName}의 시장 직송 건어물·젓갈 모듬. 짭조름한 한국의 맛.`,
    "농산물":    `${storeName}이 매일 들여오는 제철 농산물 박스. 신선함 그대로.`,
    "전통공예":  `${storeName} 장인의 손길이 담긴 수제 공예품. 단 하나뿐인 기념일 선물.`,
    "화훼":      `${storeName}이 다듬는 시장 꽃 한 다발. 마음 그대로 전합니다.`,
    "특산물":    `${region}의 ${storeName}이 자랑하는 대전 특산물. 진짜 로컬의 맛.`,
    "기타":      `${storeName}의 전통시장 시그니처. 대전의 정성을 담아 보내드립니다.`,
  };
  return lines[category] || `${storeName}의 정성 가득한 시장 선물.`;
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
      if (seen.has(it.bizesId)) continue;
      if (!shouldInclude(it)) continue;
      if (!it.bizesNm || !it.rdnmAdr || !it.lon || !it.lat) continue;

      seen.add(it.bizesId);
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

// 카테고리별 후보 분포 출력
const grouped = {};
for (const it of candidates) {
  const cat = categoryOf(it);
  (grouped[cat] = grouped[cat] || []).push(it);
}
console.log("\n📊 후보 카테고리 분포:");
for (const [cat, arr] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`   ${cat.padEnd(8)} : ${arr.length}`);
}

// 시장 다양성을 위한 카테고리별 quota
const QUOTA = {
  "장·반찬":   15,
  "한식":       20,
  "전통과자":   12,
  "특산물":     12,
  "농산물":     10,
  "분식":       8,
  "정육":       6,
  "수산":       6,
  "전통공예":   5,
  "수제빵":     4,
  "화훼":       2,
  "기타":       5,
};

let sampled = [];
for (const [cat, q] of Object.entries(QUOTA)) {
  const pool = (grouped[cat] || []).sort(() => Math.random() - 0.5);
  sampled.push(...pool.slice(0, q));
}
// 부족하면 남은 후보로 보충 (100개 채우기)
if (sampled.length < 100) {
  const used = new Set(sampled.map((it) => it.bizesId));
  const rest = candidates.filter((it) => !used.has(it.bizesId)).sort(() => Math.random() - 0.5);
  sampled.push(...rest.slice(0, 100 - sampled.length));
}
const shuffled = sampled.sort(() => Math.random() - 0.5).slice(0, 100);
console.log(`\n📦 최종 샘플링 ${shuffled.length}개\n`);

// ─────────────────────────────────────────────
const stores = shuffled.map((it) => ({
  id: randomUUID(),
  name: it.bizesNm.slice(0, 60),
  address: it.rdnmAdr,
  category: categoryOf(it),
  region: "대전",
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
