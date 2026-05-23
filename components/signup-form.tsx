"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ShoppingBag, Store } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";

export default function SignupForm() {
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
      toast.success("환영합니다!");
      window.location.href = role === "seller" ? "/seller" : "/";
    } catch (err: any) {
      toast.error(err.message);
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
          <p className="text-xs text-bark/70">가을 한 상의 시작</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label className="text-sm font-bold text-bark">가입 유형</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`group rounded-2xl border-2 p-4 text-left transition-all ${
                role === "buyer"
                  ? "border-maple bg-cream shadow-maple"
                  : "border-border hover:border-maple/30 hover:bg-accent/40"
              }`}
            >
              <ShoppingBag
                className={`h-5 w-5 mb-2 ${
                  role === "buyer" ? "text-maple" : "text-bark/70"
                }`}
              />
              <p className="font-bold text-sm">구매자</p>
              <p className="text-[11px] text-bark/70 mt-0.5">선물을 보낼래요</p>
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`group rounded-2xl border-2 p-4 text-left transition-all ${
                role === "seller"
                  ? "border-maple bg-cream shadow-maple"
                  : "border-border hover:border-maple/30 hover:bg-accent/40"
              }`}
            >
              <Store
                className={`h-5 w-5 mb-2 ${
                  role === "seller" ? "text-maple" : "text-bark/70"
                }`}
              />
              <p className="font-bold text-sm">소상공인</p>
              <p className="text-[11px] text-bark/70 mt-0.5">상품을 팔래요</p>
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-bold text-bark">
            이메일
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5 rounded-lg"
          />
        </div>
        <div>
          <Label htmlFor="displayName" className="text-sm font-bold text-bark">
            닉네임
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            required
            className="mt-1.5 rounded-lg"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-sm font-bold text-bark">
            비밀번호 (6자 이상)
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="mt-1.5 rounded-lg"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-maple-gradient text-white shadow-maple hover:opacity-90"
          disabled={submitting}
        >
          {submitting ? "가입 중…" : "가입하기"}
        </Button>

        <p className="text-center text-sm text-bark/70">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-maple hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}
