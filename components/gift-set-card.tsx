"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingCart } from "lucide-react";
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
    toast.success(`"${set.title}" 세트를 장바구니에 담았어요`);
  }

  const badgeColors = [
    "from-rose-200 to-amber-100",
    "from-amber-200 to-yellow-100",
    "from-emerald-200 to-lime-100",
  ];

  return (
    <Card
      className={`overflow-hidden border-2 ${
        rank === 1 ? "border-primary/40" : "border-border/70"
      } transition-all hover:shadow-lg p-0`}
    >
      <div
        className={`bg-gradient-to-br ${
          badgeColors[rank - 1] || badgeColors[0]
        } px-5 pt-5 pb-4`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-900/80">
          <Sparkles className="h-3.5 w-3.5" />
          AI가 차린 한 상 #{rank}
        </div>
        <h3 className="mt-2 text-xl font-bold text-stone-900">{set.title}</h3>
        <p className="mt-1 text-sm text-stone-800/80 leading-relaxed">
          {set.story}
        </p>
      </div>

      <CardContent className="space-y-3 pt-4 pb-0">
        {set.products?.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {p.image_url && (
                <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="56px" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{p.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {p.store?.name}
              </p>
            </div>
            <p className="text-sm font-semibold whitespace-nowrap">
              {p.price.toLocaleString()}원
            </p>
          </Link>
        ))}
      </CardContent>

      <div className="border-t bg-muted/30 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">한 상 합계</p>
          <p className="text-2xl font-extrabold">
            {set.total_price.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground"> 원</span>
          </p>
        </div>
        <Button onClick={addAll} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          한 상 담기
        </Button>
      </div>
    </Card>
  );
}
