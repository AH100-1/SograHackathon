import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/security/sanitize";
import { verifyCsrf } from "@/lib/security/csrf";

export const runtime = "nodejs";

const Body = z.object({
  product_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  rating: z.number().int().min(1).max(5),
});

export async function POST(req: Request) {
  // CSRF 검증
  const csrf = verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.reason }, { status: 403 });
  }

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

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // XSS 방어: HTML 정제
  const safeContent = sanitizeHtml(body.content);

  const { data: inserted, error } = await supabase
    .from("reviews")
    .insert({
      product_id: body.product_id,
      user_id: user.id,
      content: safeContent,
      rating: body.rating,
    })
    .select("*, user:users(display_name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: inserted });
}
