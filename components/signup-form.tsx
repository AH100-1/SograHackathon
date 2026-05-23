"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, ShoppingBag, Store } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "회원가입 실패");
        return;
      }
      if (data.session) {
        const sb = createClient();
        await sb.auth.setSession(data.session);
      }
      toast.success("환영합니다!");
      router.push(role === "seller" ? "/seller" : "/");
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
          <p className="text-xs text-muted-foreground">회원가입</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>가입 유형</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                role === "buyer"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <ShoppingBag className="h-4 w-4 mb-2" />
              <p className="font-semibold text-sm">구매자</p>
              <p className="text-[10px] text-muted-foreground">선물을 보낼래요</p>
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                role === "seller"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <Store className="h-4 w-4 mb-2" />
              <p className="font-semibold text-sm">소상공인</p>
              <p className="text-[10px] text-muted-foreground">상품을 팔래요</p>
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="displayName">닉네임</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="password">비밀번호 (6자 이상)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="mt-1.5"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "가입 중…" : "가입하기"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}
