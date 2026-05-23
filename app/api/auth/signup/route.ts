import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyCsrf } from "@/lib/security/csrf";
import { stripHtml } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(120),
  password: z.string().min(6).max(120),
  displayName: z.string().min(1).max(30),
  role: z.enum(["buyer", "seller"]),
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

  const safeName = stripHtml(body.displayName);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: body.email.toLowerCase(),
    password: body.password,
    options: {
      data: {
        display_name: safeName,
        role: body.role,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 트리거가 public.users에 자동 삽입하지만, role/display_name 보정
  if (data.user) {
    await supabase
      .from("users")
      .upsert(
        {
          id: data.user.id,
          email: body.email.toLowerCase(),
          display_name: safeName,
          role: body.role,
        },
        { onConflict: "id" },
      );
  }

  return NextResponse.json({ ok: true });
}
