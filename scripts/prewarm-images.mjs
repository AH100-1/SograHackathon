// 모든 상품 이미지 prewarm — Pollinations에 미리 생성 요청해서 CDN 캐싱
// 시연 직전에 한 번만 실행하면 매끄러움
// 실행: node scripts/prewarm-images.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: products } = await sb
  .from("products")
  .select("id, name, image_url");

if (!products?.length) {
  console.error("상품 없음");
  process.exit(1);
}

console.log(`${products.length}개 이미지 prewarm 시작... (각 5~10초)`);

let done = 0;
const promises = products.map(async (p) => {
  try {
    const res = await fetch(p.image_url, { method: "GET" });
    if (!res.ok) {
      console.log(`  ❌ ${p.name}: HTTP ${res.status}`);
      return;
    }
    // body 읽어서 캐싱 완료 확인
    await res.arrayBuffer();
    done++;
    if (done % 10 === 0) process.stdout.write(`  ${done}/${products.length}\r`);
  } catch (e) {
    console.log(`  ❌ ${p.name}: ${e.message}`);
  }
});

await Promise.all(promises);
console.log(`\n✅ ${done}/${products.length} prewarm 완료`);
