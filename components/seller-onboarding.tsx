"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Store } from "lucide-react";
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
    <Card className="p-8">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-extrabold text-xl">가게 정보 등록</h1>
          <p className="text-sm text-muted-foreground">
            상품을 올리려면 먼저 가게를 등록해주세요
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>가게 이름</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>주소</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={120}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>카테고리</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={30}
            required
            className="mt-1.5"
            placeholder="예: 식품·꿀"
          />
        </div>
        <div>
          <Label>가게 소개</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "등록 중…" : "가게 등록하기"}
        </Button>
      </form>
    </Card>
  );
}
