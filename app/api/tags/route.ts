import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const [{ data: categories, error: catErr }, { data: tags, error: tagErr }] = await Promise.all([
    supabase
      .from("tag_categories")
      .select("key, label, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("tags")
      .select("value, category_key, sort_order, is_signature")
      .order("sort_order", { ascending: true }),
  ]);

  if (catErr || tagErr) {
    return NextResponse.json(
      { error: catErr?.message ?? tagErr?.message },
      { status: 500 },
    );
  }

  const grouped = (categories ?? [])
    .filter((c) => c.key !== "signature")
    .map((c) => ({
      key: c.key,
      label: c.label,
      tags: (tags ?? [])
        .filter((t) => t.category_key === c.key && !t.is_signature)
        .map((t) => t.value),
    }));

  return NextResponse.json({ groups: grouped });
}
