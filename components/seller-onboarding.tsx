"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Store, Sparkles } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";

export default function SellerOnboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("식품");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, category, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "가게 등록 실패");
        return;
      }
      toast.success("가게 등록 완료! 이제 상품을 올려보세요.");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border-2 border-maple/15 bg-card p-8 shadow-maple">
      <div className="h-1.5 w-full bg-maple-gradient absolute top-0 left-0" />
      <div className="flex items-center gap-3 pt-2">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maple-gradient text-white shadow-maple">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight">가게 정보 등록</h1>
          <p className="text-sm text-bark/70">
            상품을 올리려면 먼저 가게를 등록해주세요
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-maple/20 bg-cream/50 px-4 py-3 text-xs text-bark/80 flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 text-maple mt-0.5 shrink-0" />
        <p>
          등록된 가게 정보는 상품 카드와 상세 페이지에 노출됩니다. 시장의 정성이
          느껴지는 한 줄 소개를 적어주세요.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label className="text-sm font-bold text-bark">가게 이름</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            className="mt-1.5 rounded-lg"
          />
        </div>
        <div>
          <Label className="text-sm font-bold text-bark">주소</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={120}
            required
            className="mt-1.5 rounded-lg"
          />
        </div>
        <div>
          <Label className="text-sm font-bold text-bark">카테고리</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={30}
            required
            className="mt-1.5 rounded-lg"
            placeholder="예: 식품·꿀"
          />
        </div>
        <div>
          <Label className="text-sm font-bold text-bark">가게 소개</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-1.5 rounded-lg"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 bg-maple-gradient text-white shadow-maple hover:opacity-90"
          disabled={submitting}
        >
          {submitting ? "등록 중…" : "가게 등록하기"}
        </Button>
      </form>
    </Card>
  );
}
