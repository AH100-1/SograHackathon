// 데모 사용자 + 리뷰 적재
// 실행: node scripts/seed-demo-data.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// ────────────────────────────────────────
// 1. 데모 사용자
// ────────────────────────────────────────
const DEMO_USERS = [
  { email: "admin@sogra.demo",  password: "admin1234",  role: "admin",  display_name: "운영자" },
  { email: "seller1@sogra.demo", password: "seller1234", role: "seller", display_name: "김시장" },
  { email: "seller2@sogra.demo", password: "seller1234", role: "seller", display_name: "박장수" },
  { email: "judge@sogra.demo",   password: "judge1234",  role: "buyer",  display_name: "심사위원" },
  { email: "soyeon@sogra.demo",  password: "demo1234",   role: "buyer",  display_name: "이소연" },
  { email: "minjun@sogra.demo",  password: "demo1234",   role: "buyer",  display_name: "박민준" },
  { email: "jiwon@sogra.demo",   password: "demo1234",   role: "buyer",  display_name: "최지원" },
  { email: "hyejin@sogra.demo",  password: "demo1234",   role: "buyer",  display_name: "정혜진" },
  { email: "sangho@sogra.demo",  password: "demo1234",   role: "buyer",  display_name: "강상호" },
  { email: "yuna@sogra.demo",    password: "demo1234",   role: "buyer",  display_name: "한유나" },
];

console.log("👤 데모 사용자 생성...");
const userIdByEmail = {};
for (const u of DEMO_USERS) {
  // 기존 사용자 있는지 확인 (이메일 lookup)
  const { data: existing } = await sb
    .from("users")
    .select("id, email")
    .eq("email", u.email)
    .maybeSingle();

  if (existing) {
    userIdByEmail[u.email] = existing.id;
    console.log(`   ↩ 이미 존재: ${u.email}`);
    continue;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { role: u.role, display_name: u.display_name },
  });
  if (error) {
    console.error(`   ❌ ${u.email}: ${error.message}`);
    continue;
  }
  userIdByEmail[u.email] = data.user.id;

  // 트리거가 role을 set하지만 metadata 누락 대비해 명시적 update
  await sb
    .from("users")
    .update({ role: u.role, display_name: u.display_name })
    .eq("id", data.user.id);

  console.log(`   ✓ ${u.email} (${u.role})`);
}

// ────────────────────────────────────────
// 2. 셀러를 일부 stores에 owner 로 할당
// ────────────────────────────────────────
const seller1Id = userIdByEmail["seller1@sogra.demo"];
const seller2Id = userIdByEmail["seller2@sogra.demo"];

console.log("\n🏪 셀러 가게 할당...");
const { data: stores } = await sb.from("stores").select("id").is("owner_id", null).limit(20);
if (stores && stores.length > 0) {
  const half = Math.floor(stores.length / 2);
  const s1 = stores.slice(0, half).map((s) => s.id);
  const s2 = stores.slice(half).map((s) => s.id);

  await sb.from("stores").update({ owner_id: seller1Id }).in("id", s1);
  await sb.from("stores").update({ owner_id: seller2Id }).in("id", s2);
  console.log(`   ✓ 김시장: ${s1.length}개 가게 / 박장수: ${s2.length}개 가게`);
}

// ────────────────────────────────────────
// 3. 리뷰 생성 (상품당 1~3개, ~200건)
// ────────────────────────────────────────
const buyerIds = DEMO_USERS.filter((u) => u.role === "buyer")
  .map((u) => userIdByEmail[u.email])
  .filter(Boolean);

// 카테고리별 리뷰 문구 풀
const REVIEWS_BY_CATEGORY = {
  "전통과자": [
    "어머니께 보냈는데 명절에 너무 좋아하셨어요. 단맛이 인공적이지 않고 자연스럽습니다.",
    "한과가 갓 만든 것처럼 부드러워요. 차랑 같이 먹기 딱입니다.",
    "포장도 정성스러워서 선물용으로 좋아요.",
    "약과 진짜 옛날 맛 그대로네요. 추천합니다.",
    "달지 않고 고소해서 자꾸 손이 가요.",
  ],
  "장·반찬": [
    "엄마가 해주시던 그 맛이에요. 자취하면서 늘 시켜먹게 될 것 같아요.",
    "김치가 깊은 맛이 나요. 묵은지 좋아하시는 분 추천.",
    "젓갈이 짜지 않고 감칠맛 좋네요. 밥도둑입니다.",
    "양도 푸짐하고 신선해서 만족이에요.",
    "가지무침, 깻잎 다 맛있어요. 다음에 또 시킬게요.",
  ],
  "한식": [
    "회사 회식 대신 부모님께 보내드렸는데 너무 좋아하셨어요.",
    "포장 풀자마자 따뜻하고 정갈해서 감동했습니다.",
    "재료가 신선해서 안심하고 먹을 수 있었어요.",
    "구성이 알찬데 가격도 합리적입니다.",
    "한식의 정성이 그대로 느껴져요.",
  ],
  "분식": [
    "시장 분식 그대로의 추억의 맛이네요.",
    "떡볶이 양념이 진짜 옛날 분식집 맛이에요.",
    "김밥 단무지 아삭한 식감 좋습니다.",
    "친구들과 나눠 먹기 좋아요. 양이 푸짐.",
    "만두 속이 꽉 차있어서 만족입니다.",
  ],
  "정육": [
    "한우 마블링 진짜 죽여줍니다. 명절 선물로 최고예요.",
    "고기 신선하고 손질도 깨끗하게 되어 있어요.",
    "포장이 진공으로 깔끔하게 와서 좋았습니다.",
    "부모님께 보냈는데 한 끼 잘 드셨다고 하시네요.",
    "가격대비 퀄리티가 정말 좋아요.",
  ],
  "수산": [
    "건어물 짠맛이 적당하고 감칠맛 좋아요.",
    "젓갈 비린맛 없이 깊은 맛 납니다.",
    "오징어채가 부드러워서 어른들도 좋아하세요.",
    "다음 명절에도 또 시킬 생각이에요.",
    "포장 꼼꼼하고 신선도 좋습니다.",
  ],
  "농산물": [
    "사과 향이 정말 진하네요. 시장에서 직접 산 느낌이에요.",
    "신선해서 며칠 두고 먹어도 아삭합니다.",
    "양도 푸짐하고 크기도 큼직해요.",
    "포장이 잘 되어서 깨진 거 하나도 없었어요.",
    "친구한테도 추천했습니다. 강추!",
  ],
  "전통공예": [
    "유니크한 선물로 너무 좋네요. 받는 분이 감동하셨어요.",
    "마감이 꼼꼼해서 오래 쓸 수 있을 것 같아요.",
    "디자인이 모던하면서도 전통미가 살아있어요.",
    "선물 포장도 우아하게 잘 되어 있습니다.",
    "장인의 정성이 느껴지는 작품이에요.",
  ],
  "특산물": [
    "대전 갔을 때 사오던 그 맛이에요. 반가워요!",
    "지역 특산품이라 친구한테 보내기 좋네요.",
    "패키지가 예뻐서 선물용으로 안성맞춤이에요.",
    "맛이 깊고 진해서 차 한 잔 곁들이면 좋아요.",
    "한 번 먹어보면 자꾸 생각나는 맛입니다.",
  ],
  "수제빵": [
    "갓 구운 빵 향이 그대로 살아있어요.",
    "방부제 없이도 며칠 신선해서 좋네요.",
    "겉은 바삭, 속은 촉촉! 아침으로 딱입니다.",
    "단맛이 강하지 않아 어른들도 좋아하세요.",
    "재구매 의사 100%!",
  ],
  "화훼": [
    "꽃 정말 신선하게 잘 묶어주셨어요. 사진보다 더 예뻐요.",
    "기념일 선물로 보냈는데 너무 감동받았다고 하네요.",
    "포장 디테일까지 정성이 느껴져요.",
    "오래 가요. 향도 은은하니 좋습니다.",
    "다음에도 여기서 시킬게요.",
  ],
  "기타": [
    "시장 가게에서 직접 만든 정성이 느껴져요.",
    "포장도 정갈하고 받는 사람도 만족했습니다.",
    "가격대비 만족도가 높아요.",
    "구성이 알찬 편이에요.",
    "다음에도 이용할 것 같아요.",
  ],
};

function pickReview(category) {
  const pool = REVIEWS_BY_CATEGORY[category] || REVIEWS_BY_CATEGORY["기타"];
  return pool[Math.floor(Math.random() * pool.length)];
}

console.log("\n💬 리뷰 생성...");

// 상품 + 카테고리 가져오기
const { data: products } = await sb
  .from("products")
  .select("id, store:stores(category)")
  .eq("is_approved", true);

const reviews = [];
for (const p of products || []) {
  const count = 1 + Math.floor(Math.random() * 3); // 1~3개
  const cat = p.store?.category || "기타";
  const pickedBuyers = new Set();
  for (let i = 0; i < count; i++) {
    let buyer;
    let tries = 0;
    do {
      buyer = buyerIds[Math.floor(Math.random() * buyerIds.length)];
      tries++;
    } while (pickedBuyers.has(buyer) && tries < 5);
    pickedBuyers.add(buyer);

    const rating = Math.random() < 0.75 ? 5 : Math.random() < 0.5 ? 4 : 3;
    reviews.push({
      product_id: p.id,
      user_id: buyer,
      content: pickReview(cat),
      rating,
    });
  }
}

// 일괄 insert (50씩 청크)
let inserted = 0;
for (let i = 0; i < reviews.length; i += 50) {
  const chunk = reviews.slice(i, i + 50);
  const { error } = await sb.from("reviews").insert(chunk);
  if (error) {
    console.error(`   ❌ 청크 ${i}: ${error.message}`);
    continue;
  }
  inserted += chunk.length;
  process.stdout.write(".");
}
console.log(`\n   ✓ ${inserted}개 리뷰 적재`);

console.log("\n✅ 완료!");
console.log("\n🔑 데모 계정");
for (const u of DEMO_USERS) {
  console.log(`   ${u.role.padEnd(7)} ${u.email.padEnd(25)} pw: ${u.password}`);
}
