import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyCsrf } from "@/lib/security/csrf";

export const runtime = "nodejs";

const Body = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  const csrf = verifyCsrf(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: "invalid_input", details: e.errors }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // 가격은 서버에서 다시 조회 (클라이언트 조작 방지)
  const productIds = body.items.map((i) => i.product_id);
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, price, stock")
    .in("id", productIds)
    .eq("is_approved", true);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const priceMap = new Map((products || []).map((p) => [p.id, p]));
  let total = 0;
  for (const item of body.items) {
    const p = priceMap.get(item.product_id);
    if (!p) return NextResponse.json({ error: "product_not_found" }, { status: 400 });
    if (p.stock < item.quantity) {
      return NextResponse.json({ error: "out_of_stock" }, { status: 400 });
    }
    total += p.price * item.quantity;
  }

  // 주문 생성
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({ buyer_id: user.id, total_price: total, status: "paid" })
    .select()
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: oErr?.message || "order_failed" }, { status: 500 });
  }

  const itemRows = body.items.map((it) => {
    const p = priceMap.get(it.product_id)!;
    return {
      order_id: order.id,
      product_id: it.product_id,
      quantity: it.quantity,
      price_at_purchase: p.price,
    };
  });

  const { error: itErr } = await supabase.from("order_items").insert(itemRows);
  if (itErr) {
    return NextResponse.json({ error: itErr.message }, { status: 500 });
  }

  return NextResponse.json({ order });
}
