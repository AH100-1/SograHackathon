"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, AlertTriangle } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";

export default function LoginForm() {
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
      toast.success("로그인 되었습니다");
      window.location.href = redirectTo;
    } catch {
      const msg = "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border-2 border-maple/15 bg-card p-8 shadow-maple">
      <div className="h-1.5 w-full bg-maple-gradient absolute top-0 left-0" />
      <div className="flex items-center gap-3 pt-2">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-maple-gradient text-white shadow-maple">
          <Leaf className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight">
            장터<span className="text-maple">한상</span>
          </h1>
          <p className="text-xs text-bark/70">다시 오신 걸 환영합니다</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm font-bold text-bark">
            이메일
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5 rounded-lg"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-sm font-bold text-bark">
            비밀번호
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1.5 rounded-lg"
          />
        </div>

        {errorMsg && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {errorMsg}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-11 gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90"
          disabled={submitting || !!lockedUntil}
        >
          {submitting ? "로그인 중…" : "로그인"}
        </Button>

        <p className="text-center text-sm text-bark/70">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-bold text-maple hover:underline"
          >
            회원가입
          </Link>
        </p>
      </form>
    </Card>
  );
}
