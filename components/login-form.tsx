"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, ShieldAlert } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setLockedUntil(Date.now() + (data.retryAfterSeconds || 60) * 1000);
          toast.error(
            `로그인 시도 횟수 초과. ${data.retryAfterSeconds}초 후 다시 시도해주세요.`,
          );
        } else {
          toast.error(data.error || "로그인 실패");
        }
        return;
      }
      toast.success("로그인 되었습니다");
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
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

        <Button type="submit" className="w-full" disabled={submitting || !!lockedUntil}>
          {submitting ? "로그인 중…" : "로그인"}
        </Button>

        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0" />
          5회 실패 시 15분간 잠금 (BruteForce 방어)
        </div>

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
