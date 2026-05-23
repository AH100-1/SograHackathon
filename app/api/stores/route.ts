import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyCsrf } from "@/lib/security/csrf";
import { stripHtml } from "@/lib/security/sanitize";
import { requireRole } from "@/lib/security/rbac";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(50),
  address: z.string().min(1).max(120),
  category: z.string().min(1).max(30),
  description: z.string().max(500).optional().default(""),
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: stripHtml(body.name),
      address: stripHtml(body.address),
      category: stripHtml(body.category),
      description: stripHtml(body.description),
      owner_id: auth.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ store: data });
}
