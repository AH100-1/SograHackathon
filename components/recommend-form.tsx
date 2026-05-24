"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Heart,
  Cake,
  Gift,
  HandHeart,
  Smile,
  LogIn,
  X,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

const targets = [
  { value: "부모님", label: "부모님", icon: Heart },
  { value: "친구", label: "친구", icon: Smile },
  { value: "연인", label: "연인", icon: Heart },
  { value: "상사", label: "상사·선배", icon: HandHeart },
  { value: "기타", label: "기타", icon: Gift },
];

const occasions = [
  { value: "생일", label: "생일", icon: Cake },
  { value: "명절", label: "명절", icon: Gift },
  { value: "감사", label: "감사 인사", icon: HandHeart },
  { value: "응원", label: "응원", icon: Smile },
  { value: "기념일", label: "기념일", icon: Heart },
];

const presetBudgets = [20000, 30000, 50000, 100000];

export default function RecommendForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [budget, setBudget] = useState<number>(30000);
  const [target, setTarget] = useState("부모님");
  const [customTarget, setCustomTarget] = useState("");
  const [occasion, setOccasion] = useState("생일");
  const [preference, setPreference] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((d) => setIsLoggedIn(!!d.user))
      .catch(() => setIsLoggedIn(false));
  }, []);

  function submit() {
    if (target === "기타" && !customTarget.trim()) {
      toast.error("받는 사람을 입력해주세요");
      return;
    }
    const finalTarget = target === "기타" ? customTarget.trim() : target;
    const params = new URLSearchParams({
      budget: String(budget),
      target: finalTarget,
      occasion,
      preference,
    });

    const next = `/recommend?${params.toString()}`;

    if (isLoggedIn === false) {
      setPendingRedirect(next);
      setShowLoginModal(true);
      return;
    }

    startTransition(() => {
      router.push(next);
    });
  }

  function goToLogin() {
    if (!pendingRedirect) return;
    router.push(`/login?redirect=${encodeURIComponent(pendingRedirect)}`);
  }

  return (
    <>
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bark/60 backdrop-blur-sm p-4 animate-warm-rise"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-maple/20 bg-card p-7 shadow-maple-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maple-gradient text-white shadow-maple">
              <LogIn className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold tracking-tight">
              로그인이 필요해요
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bark/75">
              꿈돌이에게 한 상을 차려달라고 하려면 먼저 로그인해주세요. 받는 분께
              꼭 맞는 가을 한 상을 추천해드릴게요.
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLoginModal(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90"
                onClick={goToLogin}
              >
                <LogIn className="h-4 w-4" />
                로그인하러 가기
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="relative overflow-hidden rounded-3xl border-2 border-maple/25 bg-card/95 shadow-maple-lg backdrop-blur">
        {/* 헤더 라인 */}
        <div className="h-1.5 w-full bg-maple-gradient" />

        <div className="px-7 pb-7 pt-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-persimmon">
            <Wand2 className="h-3.5 w-3.5" />
            한 상 차림 큐레이션
          </div>

          <div>
            <Label className="text-sm font-bold text-bark">예산</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {presetBudgets.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                    budget === b
                      ? "border-maple bg-maple-gradient text-white shadow-maple"
                      : "border-border text-bark hover:border-maple/40 hover:bg-accent"
                  }`}
                >
                  {b.toLocaleString()}원
                </button>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={5000}
                  step={1000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-32 rounded-lg"
                />
                <span className="text-sm text-bark/70">원</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-bold text-bark">받는 사람</Label>
              <Select value={target} onValueChange={(v) => v && setTarget(v)}>
                <SelectTrigger className="mt-2 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-bold text-bark">어떤 취향인가요</Label>
              <Select value={occasion} onValueChange={(v) => v && setOccasion(v)}>
                <SelectTrigger className="mt-2 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {target === "기타" && (
            <div className="animate-warm-rise">
              <Label className="text-sm font-bold text-bark">
                받는 사람 직접 입력
              </Label>
              <Input
                placeholder="예: 사촌오빠, 회사 후배, 조카…"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="mt-2 rounded-lg"
                maxLength={30}
                autoFocus
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-bold text-bark">
              받는 분의 취향{" "}
              <span className="font-medium text-muted-foreground">(선택)</span>
            </Label>
            <Input
              placeholder="예: 건강 챙기시는 분, 단 거 좋아함, 술 즐김…"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="mt-2 rounded-lg"
              maxLength={120}
            />
          </div>

          <Button
            size="lg"
            className="w-full gap-2 text-base font-bold h-13 py-3.5 bg-maple-gradient text-white shadow-maple hover:opacity-90 hover:shadow-maple-lg"
            onClick={submit}
            disabled={isPending || isLoggedIn === null}
          >
            <Sparkles className="h-5 w-5" />
            {isPending
              ? "꿈돌이가 한 상을 차리는 중…"
              : isLoggedIn === null
              ? "준비 중…"
              : "꿈돌이에게 한 상 차려달라고 하기"}
          </Button>
        </div>
      </Card>
    </>
  );
}
