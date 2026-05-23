import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyCsrf } from "@/lib/security/csrf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const csrf = verifyCsrf(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
