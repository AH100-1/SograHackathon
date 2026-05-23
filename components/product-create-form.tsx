"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";

type TagGroup = { key: string; label: string; tags: string[] };

const MAX_TAGS = 8;

export default function ProductCreateForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(10000);
  const [stock, setStock] = useState(50);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [groups, setGroups] = useState<TagGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(["부모님", "건강"]));
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, []);

  function toggleTag(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        if (next.size >= MAX_TAGS) {
          toast.error(`태그는 최대 ${MAX_TAGS}개까지 선택할 수 있습니다`);
          return prev;
        }
        next.add(tag);
      }
      return next;
    });
  }

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
          tags: Array.from(selected),
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "등록 실패");
        return;
      }
      setName("");
      setPrice(10000);
      setStock(50);
      setImageUrl("");
      setSelected(new Set(["부모님", "건강"]));
      setDescription("");
      setShowPendingModal(true);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {showPendingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
          onClick={() => setShowPendingModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold tracking-tight">
              상품 점검 중입니다
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              관리자가 등록하신 상품을 검토 중이에요. 검토가 끝나면 자동으로
              상점에 노출됩니다. 잠시만 기다려 주세요.
            </p>
            <div className="mt-5 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                내 상품 목록에서 <span className="font-semibold text-foreground">&apos;승인대기&apos;</span>
                <span>배지로 확인할 수 있어요.</span>
              </div>
            </div>
            <Button
              className="mt-6 w-full"
              onClick={() => setShowPendingModal(false)}
            >
              확인
            </Button>
          </div>
        </div>
      )}

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            태그 <span className="text-muted-foreground">({selected.size}/{MAX_TAGS})</span>
          </Label>
          <span className="text-[10px] text-muted-foreground">
            로컬 / 대전 / 전통시장은 자동 부여
          </span>
        </div>
        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
          {groups.length === 0 ? (
            <p className="text-xs text-muted-foreground">태그 목록 로드 중…</p>
          ) : (
            groups.map((g) => (
              <div key={g.key}>
                <div className="mb-1 text-[10px] font-medium text-muted-foreground">
                  {g.label}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.tags.map((tag) => {
                    const on = selected.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-accent",
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
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
    </>
  );
}
