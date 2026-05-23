import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
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
  const email = body.email.toLowerCase();

  // 1) service role 로 즉시 confirm된 사용자 생성 (이메일 인증 우회 — 데모용)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      display_name: safeName,
      role: body.role,
    },
  });

  if (createErr) {
    // 이메일 중복 등
    return NextResponse.json(
      { error: createErr.message.includes("already") ? "email_taken" : "signup_failed" },
      { status: 400 },
    );
  }

  // 2) public.users 보정 (트리거 사용 + 명시적 update)
  if (created.user) {
    await admin
      .from("users")
      .upsert(
        {
          id: created.user.id,
          email,
          display_name: safeName,
          role: body.role,
        },
        { onConflict: "id" },
      );
  }

  // 3) 즉시 로그인 (세션 생성) → 클라이언트가 자동 로그인 처리
  const supabase = await createServerClient();
  const { data: signin, error: signinErr } = await supabase.auth.signInWithPassword({
    email,
    password: body.password,
  });

  if (signinErr) {
    // 사용자는 만들어졌지만 자동 로그인 실패 — 클라이언트에서 /login 으로 안내
    return NextResponse.json({ ok: true, session: null });
  }

  return NextResponse.json({
    ok: true,
    session: signin.session
      ? {
          access_token: signin.session.access_token,
          refresh_token: signin.session.refresh_token,
        }
      : null,
  });
}
