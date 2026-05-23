import { NextResponse } from "next/server";
import { z } from "zod";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { stripHtml } from "@/lib/security/sanitize";
import type { GiftSet, Product } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  budget: z.number().int().min(5000).max(1_000_000),
  target: z.string().min(1).max(40),
  occasion: z.string().min(1).max(40),
  preference: z.string().max(200).optional().default(""),
});

const SETS_SCHEMA_HINT = `
응답은 반드시 아래 형식의 순수 JSON만:
{
  "sets": [
    {
      "title": "감성적인 세트 제목 (15자 이내)",
      "story": "받는 분에게 전달되는 50자 내외의 진심 어린 한국어 스토리",
      "product_ids": ["uuid1", "uuid2", "uuid3"]
    }
  ]
}

규칙:
- 정확히 3개의 세트 추천
- 각 세트는 2~3개 상품 조합
- 세트 합계는 예산을 절대 초과하지 말 것
- product_ids 는 반드시 아래 상품 목록의 id 만 사용
- 가급적 서로 다른 가게의 상품을 조합
- story 는 따뜻하고 구체적으로, 받는 사람에 맞춤
- title 은 비유와 감성을 담아 (예: "햇살 같은 아침 한 잔")
`;

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Schema.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "invalid_input", details: e.errors },
      { status: 400 },
    );
  }

  const { budget, target, occasion, preference } = parsed;

  // 입력 정제 (프롬프트 인젝션 완화 — HTML/태그 제거)
  const safeTarget = stripHtml(target);
  const safeOccasion = stripHtml(occasion);
  const safePreference = stripHtml(preference);

  // 후보 상품 조회 — 단가가 예산 80% 이하 (3개 조합용 여유)
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*, store:stores(name, region, category)")
    .eq("is_approved", true)
    .lte("price", Math.ceil(budget * 0.8))
    .order("price", { ascending: true })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }

  const productList = (products || []) as Product[];
  if (productList.length === 0) {
    return NextResponse.json({ sets: [], reason: "no_products" });
  }

  // Gemini 입력용 상품 요약
  const productsForGemini = productList.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    tags: p.tags,
    store: p.store?.name,
    desc: p.description?.slice(0, 80),
  }));

  const userMessage = `
[받는 분]
- 대상: ${safeTarget}
- 자리(occasion): ${safeOccasion}
- 취향/특이사항: ${safePreference || "(없음)"}

[예산]
${budget.toLocaleString()}원 이하

[선택 가능한 상품 목록 — 이 안에서만 고를 것]
${JSON.stringify(productsForGemini, null, 2)}

${SETS_SCHEMA_HINT}
`;

  let geminiText = "";
  try {
    const resp = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: userMessage,
      config: {
        systemInstruction:
          "당신은 대전 전통시장(중앙·태평·유성5일장·한민·인동 등) 전문 선물 큐레이터입니다. 시장 가게의 정성과 한국적 정서가 살아있는 따뜻한 톤으로 '한 상'을 차려 추천합니다. 반드시 JSON만 응답합니다.",
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });
    geminiText = resp.text ?? "";
  } catch (e: any) {
    return NextResponse.json(
      { error: "gemini_error", message: e.message },
      { status: 502 },
    );
  }

  // JSON 파싱 (마크다운 코드블록 케이스도 방어)
  let parsedJson: { sets?: Array<{ title: string; story: string; product_ids: string[] }> };
  try {
    const cleaned = geminiText
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    parsedJson = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  } catch {
    return NextResponse.json(
      { error: "parse_error", raw: geminiText.slice(0, 500) },
      { status: 502 },
    );
  }

  // 상품 ID -> Product 매핑 + 검증
  const productMap = new Map(productList.map((p) => [p.id, p]));
  const sets: GiftSet[] = (parsedJson.sets || [])
    .map((s) => {
      const products = (s.product_ids || [])
        .map((id) => productMap.get(id))
        .filter((p): p is Product => Boolean(p));
      const total = products.reduce((acc, p) => acc + p.price, 0);
      return {
        title: stripHtml(s.title).slice(0, 40),
        story: stripHtml(s.story).slice(0, 200),
        product_ids: products.map((p) => p.id),
        total_price: total,
        products,
      };
    })
    .filter((s) => s.products && s.products.length >= 2 && s.total_price <= budget)
    .slice(0, 3);

  if (sets.length === 0) {
    return NextResponse.json(
      { error: "no_valid_sets", raw: geminiText.slice(0, 500) },
      { status: 502 },
    );
  }

  return NextResponse.json({ sets });
}
