// 상품마다 정확한 이미지 생성 (Pollinations.ai · 키 없음, 무료)
// 같은 상품 ID = 같은 seed = 항상 같은 이미지 (deterministic)
// 실행: node scripts/update-product-images.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// 카테고리 → AI 이미지 prompt 베이스 (영문이 더 정확)
const CATEGORY_PROMPT = {
  "전통과자":
    "Korean traditional sweets, yakgwa hangwa rice cake hangwa, beautifully arranged on wooden tray",
  "장·반찬":
    "Korean side dishes banchan, kimchi jeotgal jangajji in ceramic bowls, traditional Korean table",
  "한식":
    "Korean traditional meal hansik, multiple ceramic bowls of bibimbap kimchi rice, top-down view",
  "분식":
    "Korean street food, tteokbokki gimbap mandu, casual market style plate",
  "정육":
    "Korean beef hanwoo, premium marbled cut on wooden board, butcher shop style",
  "수산":
    "Korean dried seafood, anchovy squid jerky in traditional baskets, fish market style",
  "농산물":
    "Korean fresh farm produce, seasonal fruits vegetables in wicker basket",
  "전통공예":
    "Korean traditional ceramic pottery, handmade celadon bowls on wooden shelf, artisan craft",
  "화훼":
    "fresh flower bouquet wrapped in paper, traditional Korean market florist style",
  "특산물":
    "Korean specialty food gift box, regional Daejeon traditional product",
  "수제빵":
    "artisan bakery bread on wooden board, freshly baked, rustic style",
  "기타":
    "Korean traditional market gift, wrapped beautifully",
};

// 상품명 키워드 → 정확한 prompt (가장 어울리는 단일 케이스)
const KEYWORD_PROMPT = [
  { kw: ["꿀"], p: "Korean wild honey in glass jar, golden color, wooden honey dipper" },
  { kw: ["떡"], p: "Korean rice cake tteok colorful assortment on wooden plate" },
  { kw: ["한과", "약과", "강정"], p: "Korean traditional sweets yakgwa hangwa decorative arrangement" },
  { kw: ["김치"], p: "Korean kimchi in ceramic onggi pot, vibrant red fermented" },
  { kw: ["고추장", "장류", "된장"], p: "Korean fermented paste gochujang doenjang in earthen pot onggi" },
  { kw: ["젓갈", "굴젓"], p: "Korean salted seafood jeotgal in ceramic bowl" },
  { kw: ["호두", "호두과자"], p: "Korean walnut cookies hodugwaja on plate, traditional Cheonan style" },
  { kw: ["인삼"], p: "Korean ginseng root tea brewing in ceramic teapot" },
  { kw: ["차"], p: "Korean traditional tea ceremony, herbal tea in ceramic cup" },
  { kw: ["막걸리", "양조", "주류"], p: "Korean rice wine makgeolli in traditional bottle and bowl" },
  { kw: ["꽃", "다발"], p: "fresh flower bouquet wrapped in paper, seasonal blooms" },
  { kw: ["한우", "정육"], p: "Korean hanwoo beef marbled premium cut on wooden board" },
  { kw: ["건어물"], p: "Korean dried seafood anchovy assortment, traditional market" },
  { kw: ["오징어"], p: "Korean dried squid jerky on wooden tray" },
  { kw: ["멸치"], p: "Korean dried anchovy myeolchi in ceramic bowl" },
  { kw: ["딸기", "잼"], p: "Korean strawberry jam in glass jar with fresh strawberries" },
  { kw: ["빵", "베이커리"], p: "artisan bread variety on wooden board, traditional bakery" },
  { kw: ["밤"], p: "Korean roasted chestnut snack from Gongju, traditional pastry" },
  { kw: ["과자", "쿠키"], p: "Korean traditional cookie assortment" },
  { kw: ["반찬"], p: "Korean side dishes banchan kimchi jangajji in multiple ceramic bowls" },
  { kw: ["청과", "농산", "과일"], p: "Korean seasonal fruits in wicker basket, farm fresh" },
  { kw: ["채소", "야채"], p: "Korean fresh vegetables farm produce" },
  { kw: ["떡방앗간", "방앗간"], p: "Korean rice cake shop tteokbangakgan, traditional sweets display" },
  { kw: ["젓갈"], p: "Korean salted fish jeotgal in ceramic onggi" },
];

function hashUuid(uuid) {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildPrompt(product) {
  const name = product.name || "";
  // 1) 상품명 키워드 우선
  for (const { kw, p } of KEYWORD_PROMPT) {
    if (kw.some((k) => name.includes(k))) return p;
  }
  // 2) 카테고리 베이스
  const cat = product.store?.category || "기타";
  return CATEGORY_PROMPT[cat] || CATEGORY_PROMPT["기타"];
}

function buildImageUrl(product) {
  const prompt = `${buildPrompt(product)}, professional food photography, natural lighting, no text`;
  const seed = hashUuid(product.id) % 1000000;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&model=flux&nologo=true&seed=${seed}`;
}

console.log("AI 이미지 URL 생성 (Pollinations.ai · flux 모델)\n");

const { data: products } = await sb
  .from("products")
  .select("id, name, store:stores(category)");

if (!products?.length) {
  console.error("상품 없음");
  process.exit(1);
}

console.log(`${products.length}개 상품 URL 갱신 중...`);

let done = 0;
for (const p of products) {
  const url = buildImageUrl(p);
  const { error } = await sb.from("products").update({ image_url: url }).eq("id", p.id);
  if (error) console.error("  ❌", p.id, error.message);
  else done++;
  if (done % 20 === 0) process.stdout.write(`  ${done}/${products.length}\r`);
}
console.log(`  ${done}/${products.length}\n`);
console.log("✅ 완료. 각 상품마다 고유한 AI 이미지 생성됨.");
console.log("⚠️  첫 hit 시 5~10초 정도 걸릴 수 있음 (Pollinations 서버가 생성). 이후엔 CDN 캐싱.");
console.log("\n예시 URL:");
console.log(buildImageUrl(products[0]).slice(0, 150) + "...");
