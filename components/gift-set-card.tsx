"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBasket, Award, Leaf } from "lucide-react";
import type { GiftSet } from "@/types/database";
import { useCart } from "@/lib/store/cart";
import { toast } from "sonner";

export default function GiftSetCard({
  set,
  rank,
}: {
  set: GiftSet;
  rank: number;
}) {
  const add = useCart((s) => s.add);

  function addAll() {
    if (!set.products) return;
    set.products.forEach((p) => add(p, 1));
    toast.success(`"${set.title}" 한 상을 장바구니에 담았어요`);
  }

  // 랭크별 가을 톤
  const themes = [
    {
      bg: "bg-maple-gradient",
      border: "border-maple/50",
      shadow: "shadow-maple",
      badgeText: "text-white",
      icon: <Award className="h-3.5 w-3.5" />,
      label: "AI 최고 추천",
    },
    {
      bg: "bg-[linear-gradient(135deg,#D4621C_0%,#E5A82C_100%)]",
      border: "border-persimmon/40",
      shadow: "shadow-md",
      badgeText: "text-white",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      label: "감 익은 한 상",
    },
    {
      bg: "bg-[linear-gradient(135deg,#E5A82C_0%,#C9A24A_100%)]",
      border: "border-mustard/40",
      shadow: "shadow-md",
      badgeText: "text-white",
      icon: <Leaf className="h-3.5 w-3.5" />,
      label: "은행잎 한 상",
    },
  ];
  const t = themes[rank - 1] || themes[0];

  return (
    <Card
      className={`group overflow-hidden rounded-3xl border-2 ${t.border} ${t.shadow} transition-all hover:-translate-y-1 hover:shadow-maple-lg p-0 gap-0`}
    >
      {/* 헤더: 가을 그라데이션 */}
      <div className={`relative ${t.bg} px-6 pt-6 pb-5 ${t.badgeText}`}>
        <Leaf
          aria-hidden
          className="absolute -top-2 -right-2 h-24 w-24 text-white/10 rotate-12"
        />
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
            {t.icon}
            한 상 #{rank}
          </span>
          <span className="text-[11px] font-semibold opacity-90">{t.label}</span>
        </div>
        <h3 className="mt-3 text-xl font-extrabold leading-tight md:text-[22px]">
          {set.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{set.story}</p>
      </div>

      {/* 상품 리스트 */}
      <CardContent className="space-y-1.5 pt-4 pb-2 px-4">
        {set.products?.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent transition-colors"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-border bg-warm-gradient">
              {p.image_url && (
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1 text-foreground">
                {p.name}
              </p>
              <p className="text-xs text-bark/70 line-clamp-1">
                {p.store?.name}
              </p>
            </div>
            <p className="text-sm font-bold whitespace-nowrap text-foreground">
              {p.price.toLocaleString()}원
            </p>
          </Link>
        ))}
      </CardContent>

      {/* 푸터: 합계 + CTA */}
      <div className="border-t border-border/60 bg-cream/40 px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-persimmon">
            한 상 합계
          </p>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-foreground">
            {set.total_price.toLocaleString()}
            <span className="text-sm font-medium text-muted-foreground"> 원</span>
          </p>
        </div>
        <Button
          onClick={addAll}
          className="gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90"
        >
          <ShoppingBasket className="h-4 w-4" />
          한 상 담기
        </Button>
      </div>
    </Card>
  );
}
