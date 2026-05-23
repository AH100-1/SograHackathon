import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyCsrf } from "@/lib/security/csrf";
import { sanitizeHtml, stripHtml } from "@/lib/security/sanitize";
import { isUrlSafe } from "@/lib/security/ssrf";
import { requireRole } from "@/lib/security/rbac";

export const runtime = "nodejs";

// GET: 상품 검색/리스트 (SQLi 시연용 — Supabase ORM이 자동 이스케이프)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.slice(0, 80) || "";
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, store:stores(*)")
    .eq("is_approved", true)
    .limit(40);

  if (q) {
    // ' OR 1=1 -- 같은 페이로드를 그대로 전달해도
    // Supabase ORM은 이를 단순 텍스트로 처리 (Prepared Statement).
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data, q });
}

const Body = z.object({
  store_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  price: z.number().int().min(0).max(10_000_000),
  stock: z.number().int().min(0).max(100_000),
  image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string().max(20)).max(8).default([]),
  description: z.string().max(2000).optional().default(""),
});

export async function POST(req: Request) {
  const csrf = verifyCsrf(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const auth = await requireRole(["seller", "admin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: "invalid_input", details: e.errors }, { status: 400 });
  }

  // SSRF 방어: 외부 이미지 URL은 화이트리스트 호스트만 허용
  if (body.image_url) {
    const safe = isUrlSafe(body.image_url);
    if (!safe.ok) {
      return NextResponse.json(
        { error: "ssrf_blocked", reason: safe.reason },
        { status: 400 },
      );
    }
  }

  const supabase = await createClient();

  // 본인 가게인지 검증 (이중 방어; RLS가 1차 방어)
  const { data: store } = await supabase
    .from("stores")
    .select("owner_id")
    .eq("id", body.store_id)
    .single();

  if (!store) return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  if (store.owner_id !== auth.userId && auth.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: body.store_id,
      name: stripHtml(body.name),
      price: body.price,
      stock: body.stock,
      image_url: body.image_url || null,
      tags: body.tags.map((t) => stripHtml(t)),
      description: sanitizeHtml(body.description),
      // 시연 편의상 자동 승인. 실제로는 false 로 두고 admin 승인 후 노출
      is_approved: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
