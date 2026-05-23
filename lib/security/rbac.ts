import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

/**
 * 서버 측 RBAC 헬퍼. API Route에서 호출하여 권한 검증.
 * Supabase RLS와 함께 이중 방어.
 */
export async function requireRole(allowed: UserRole[]): Promise<{
  ok: true;
  userId: string;
  role: UserRole;
} | {
  ok: false;
  status: number;
  reason: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, reason: "unauthenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role || "buyer") as UserRole;
  if (!allowed.includes(role)) {
    return { ok: false, status: 403, reason: "forbidden" };
  }

  return { ok: true, userId: user.id, role };
}
