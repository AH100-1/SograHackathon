// Gemini Flash 이미지 생성 (서버 전용)
// gemini-2.5-flash-image 모델 호출 → base64 → Supabase Storage 업로드 → public URL
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const MODEL = "gemini-2.5-flash-image";

function buildPrompt(name: string, category?: string | null): string {
  const cat = category ? `Category: ${category}. ` : "";
  return (
    `Korean traditional market product photo. ${cat}Product: ${name}. ` +
    `Professional food photography, top-down or 3/4 angle, ` +
    `natural daylight, on rustic wooden surface, no text, no watermark, no people.`
  );
}

/**
 * Gemini로 상품 이미지 생성 → Supabase Storage 업로드 → public URL 반환.
 * 실패(quota / 모델 미지원 / 업로드 에러) 시 null.
 */
export async function generateAndUploadImage(
  name: string,
  category?: string | null,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceKey) return null;

  // 1) Gemini 호출
  let imageBytes: Buffer | null = null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(name, category),
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });
    const parts = res.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(
      (p: { inlineData?: { data?: string } }) => p.inlineData?.data,
    );
    if (!imgPart?.inlineData?.data) return null;
    imageBytes = Buffer.from(imgPart.inlineData.data, "base64");
  } catch (e) {
    console.error("[gemini-image] generate failed:", (e as Error).message);
    return null;
  }

  // 2) Supabase Storage 업로드
  try {
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const path = `${randomUUID()}.jpg`;
    const { error } = await sb.storage
      .from("product-images")
      .upload(path, imageBytes, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (error) {
      console.error("[gemini-image] upload failed:", error.message);
      return null;
    }
    const {
      data: { publicUrl },
    } = sb.storage.from("product-images").getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.error("[gemini-image] storage failed:", (e as Error).message);
    return null;
  }
}
