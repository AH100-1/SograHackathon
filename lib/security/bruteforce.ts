import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 15 * 60; // 15분

/**
 * 로그인 시도 횟수 추적. 5회 실패 시 15분 잠금.
 * Supabase의 login_attempts 테이블에 기록.
 */
export async function checkBruteForce(identifier: string): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
}> {
  const sb = createServiceRoleClient();
  const since = new Date(Date.now() - LOCK_SECONDS * 1_000).toISOString();

  const { data: attempts } = await sb
    .from("login_attempts")
    .select("attempted_at, success")
    .eq("identifier", identifier)
    .gte("attempted_at", since)
    .order("attempted_at", { ascending: false });

  const recentFailures = (attempts || []).filter((a: any) => !a.success);
  if (recentFailures.length >= MAX_ATTEMPTS) {
    const lastFail = new Date(recentFailures[0].attempted_at).getTime();
    const unlockAt = lastFail + LOCK_SECONDS * 1_000;
    const retryAfter = Math.max(1, Math.ceil((unlockAt - Date.now()) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return {
    allowed: true,
    attemptsRemaining: MAX_ATTEMPTS - recentFailures.length,
  };
}

export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  ip: string | null = null,
) {
  const sb = createServiceRoleClient();
  await sb.from("login_attempts").insert({
    identifier,
    success,
    ip,
    attempted_at: new Date().toISOString(),
  });
}
