"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";

export default function ProductCreateForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(10000);
  const [stock, setStock] = useState(50);
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("부모님,건강");
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          name,
          price,
          stock,
          image_url: imageUrl || null,
          tags: tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "등록 실패");
        return;
      }
      toast.success("상품이 등록되었습니다");
      setName("");
      setPrice(10000);
      setStock(50);
      setImageUrl("");
      setTags("부모님,건강");
      setDescription("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label className="text-xs">상품 이름</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">가격 (원)</Label>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">재고</Label>
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">
          이미지 URL <span className="text-muted-foreground">(SSRF allowlist 적용)</span>
        </Label>
        <Input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">태그 (쉼표로 구분)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">설명</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className="mt-1"
        />
      </div>
      <Button type="submit" className="w-full" size="sm" disabled={submitting}>
        {submitting ? "등록 중…" : "상품 등록"}
      </Button>
    </form>
  );
}
