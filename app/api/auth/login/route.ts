import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyCsrf } from "@/lib/security/csrf";
import { checkBruteForce, recordLoginAttempt } from "@/lib/security/bruteforce";
import { stripHtml } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(120),
  password: z.string().min(6).max(120),
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

  const email = stripHtml(body.email).toLowerCase();
  const ip = req.headers.get("x-forwarded-for") || null;

  // BruteForce 잠금 확인
  const check = await checkBruteForce(email);
  if (!check.allowed) {
    return NextResponse.json(
      {
        error: "too_many_attempts",
        retryAfterSeconds: check.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(check.retryAfterSeconds) } },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: body.password,
  });

  if (error) {
    await recordLoginAttempt(email, false, ip);
    return NextResponse.json(
      {
        error: "invalid_credentials",
        attemptsRemaining: Math.max(0, (check.attemptsRemaining || 5) - 1),
      },
      { status: 401 },
    );
  }

  await recordLoginAttempt(email, true, ip);
  return NextResponse.json({ ok: true });
}
