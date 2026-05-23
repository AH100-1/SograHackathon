"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClipboardCheck, CheckCircle2, ImagePlus, Sparkles } from "lucide-react";

type TagGroup = { key: string; label: string; tags: string[] };

const MAX_DESCRIPTIVE_TAGS = 6;

function isRecipientGroup(g: TagGroup) {
  return g.key === "recipient" || g.key === "받는사람" || g.label === "받는 사람";
}

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

  const recipientTagSet = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      if (isRecipientGroup(g)) for (const t of g.tags) set.add(t);
    }
    return set;
  }, [groups]);

  const recipientSelectedCount = useMemo(
    () => Array.from(selected).filter((t) => recipientTagSet.has(t)).length,
    [selected, recipientTagSet],
  );
  const descriptiveSelectedCount = selected.size - recipientSelectedCount;

  function toggleTag(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        const isRecipient = recipientTagSet.has(tag);
        if (!isRecipient) {
          const descCount = Array.from(next).filter((t) => !recipientTagSet.has(t)).length;
          if (descCount >= MAX_DESCRIPTIVE_TAGS) {
            toast.error(`특성 태그는 최대 ${MAX_DESCRIPTIVE_TAGS}개까지 선택할 수 있습니다`);
            return prev;
          }
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-bark/60 backdrop-blur-sm p-4 animate-warm-rise"
          onClick={() => setShowPendingModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-maple/20 bg-card p-7 shadow-maple-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mustard text-white shadow">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold tracking-tight">
              상품 점검 중입니다
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bark/75">
              관리자가 등록하신 상품을 검토 중이에요. 검토가 끝나면 자동으로
              상점에 노출됩니다. 잠시만 기다려 주세요.
            </p>
            <div className="mt-5 rounded-xl border border-border bg-cream/60 p-3 text-xs text-bark/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-maple" />
                내 상품 목록에서{" "}
                <span className="font-bold text-foreground">&apos;승인대기&apos;</span>
                <span>배지로 확인할 수 있어요.</span>
              </div>
            </div>
            <Button
              className="mt-6 w-full bg-maple-gradient text-white shadow-maple hover:opacity-90"
              onClick={() => setShowPendingModal(false)}
            >
              확인
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <Label className="text-xs font-bold text-bark">상품 이름</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className="mt-1 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-bold text-bark">가격 (원)</Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-bark">재고</Label>
            <Input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              required
              className="mt-1 rounded-lg"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-bold text-bark flex items-center gap-1.5">
            <ImagePlus className="h-3.5 w-3.5 text-maple" />
            이미지 URL
            <span className="font-medium text-muted-foreground">
              (미입력 시 자동 매칭)
            </span>
          </Label>
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… (Naver/Pexels에서 자동 검색)"
            className="mt-1 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-bark">
              태그{" "}
              <span className="font-medium text-muted-foreground">
                (받는 사람 {recipientSelectedCount} · 특성 {descriptiveSelectedCount}/
                {MAX_DESCRIPTIVE_TAGS})
              </span>
            </Label>
            <span className="text-[10px] text-muted-foreground">
              로컬 / 대전 / 전통시장은 자동 부여
            </span>
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-cream/40 p-3">
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground">태그 목록 로드 중…</p>
            ) : (
              groups.map((g) => (
                <div key={g.key}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-persimmon">
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
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                            on
                              ? "border-maple bg-maple-gradient text-white shadow-sm"
                              : "border-border bg-card text-bark hover:border-maple/40 hover:bg-accent",
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
          <Label className="text-xs font-bold text-bark">설명</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-1 rounded-lg"
          />
        </div>
        <Button
          type="submit"
          className="w-full gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90"
          size="sm"
          disabled={submitting}
        >
          <Sparkles className="h-4 w-4" />
          {submitting ? "등록 중…" : "상품 등록"}
        </Button>
      </form>
    </>
  );
}
