"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ERROR_MESSAGES: Record<string, string> = {
    invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    missing_csrf_token: "보안 토큰이 없습니다. 페이지를 새로고침 후 시도해주세요.",
    csrf_token_mismatch: "보안 토큰이 일치하지 않습니다. 페이지를 새로고침 후 시도해주세요.",
    invalid_input: "입력값이 올바르지 않습니다.",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await csrfFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          const msg = `로그인 시도 횟수 초과. ${data.retryAfterSeconds}초 후 다시 시도해주세요.`;
          setLockedUntil(Date.now() + (data.retryAfterSeconds || 60) * 1000);
          setErrorMsg(msg);
          toast.error(msg);
        } else {
          const msg = ERROR_MESSAGES[data.error] || "로그인에 실패했습니다.";
          setErrorMsg(msg);
          toast.error(msg);
        }
        return;
      }
      // 서버에서 받은 세션을 클라이언트 supabase에 주입 → onAuthStateChange 발화 → Navbar 갱신
      if (data.session) {
        const sb = createClient();
        await sb.auth.setSession(data.session);
      }
      toast.success("로그인 되었습니다");
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      const msg = "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-2 border-primary/10 p-8">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Gift className="h-4 w-4" />
        </span>
        <div>
          <h1 className="font-extrabold text-xl">장터한상</h1>
          <p className="text-xs text-muted-foreground">로그인</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1.5"
          />
        </div>

        {errorMsg && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMsg}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting || !!lockedUntil}>
          {submitting ? "로그인 중…" : "로그인"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </form>
    </Card>
  );
}
