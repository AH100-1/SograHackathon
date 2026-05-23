import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, display_name, role")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    user: profile
      ? {
          email: profile.email,
          display_name: profile.display_name,
          role: profile.role,
        }
      : null,
  });
}
