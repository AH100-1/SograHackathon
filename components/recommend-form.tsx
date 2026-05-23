"use client";

import { useState, useTransition } from "react";
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
import { Sparkles, Heart, Cake, Gift, HandHeart, Smile } from "lucide-react";

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
  const [occasion, setOccasion] = useState("생일");
  const [preference, setPreference] = useState("");

  function submit() {
    const params = new URLSearchParams({
      budget: String(budget),
      target,
      occasion,
      preference,
    });
    startTransition(() => {
      router.push(`/recommend?${params.toString()}`);
    });
  }

  return (
    <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
      <div className="px-7 pb-7 pt-2 space-y-6">
        <div>
          <Label className="text-sm font-semibold">💰 예산</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {presetBudgets.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudget(b)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  budget === b
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
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
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold">🎁 받는 사람</Label>
            <Select value={target} onValueChange={(v) => v && setTarget(v)}>
              <SelectTrigger className="mt-2">
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
            <Label className="text-sm font-semibold">🎂 어떤 자리인가요</Label>
            <Select value={occasion} onValueChange={(v) => v && setOccasion(v)}>
              <SelectTrigger className="mt-2">
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

        <div>
          <Label className="text-sm font-semibold">
            🌿 받는 분의 취향 <span className="font-normal text-muted-foreground">(선택)</span>
          </Label>
          <Input
            placeholder="예: 건강 챙기시는 분, 단 거 좋아함, 술 즐김…"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            className="mt-2"
            maxLength={120}
          />
        </div>

        <Button
          size="lg"
          className="w-full gap-2 text-base font-semibold h-12"
          onClick={submit}
          disabled={isPending}
        >
          <Sparkles className="h-5 w-5" />
          {isPending ? "AI 가 고르는 중…" : "AI 선물 세트 추천받기"}
        </Button>
      </div>
    </Card>
  );
}
