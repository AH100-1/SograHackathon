// product-images 버킷 생성 (한 번만 실행)
// 실행: node scripts/setup-storage.mjs

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await sb.storage.createBucket("product-images", {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});

if (error) {
  if (error.message.includes("already exists") || error.message.includes("Duplicate")) {
    console.log("ℹ️ 이미 존재함 — product-images");
  } else {
    console.error("❌", error.message);
    process.exit(1);
  }
} else {
  console.log("✅ 버킷 생성:", data);
}
