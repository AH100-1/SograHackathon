"use client";

import Link from "next/link";
import SafeImage from "@/components/safe-image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import type { Product } from "@/types/database";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/70 bg-card p-0 gap-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-maple/30">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-warm-gradient">
          <SafeImage
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.store?.category && (
            <Badge
              variant="secondary"
              className="absolute left-3 top-3 border-0 bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-bark shadow-sm backdrop-blur"
            >
              {product.store.category}
            </Badge>
          )}
          {/* 하단 그라데이션 — 가독성 */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent"
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col gap-2">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold leading-snug line-clamp-2 text-foreground transition-colors group-hover:text-maple">
            {product.name}
          </h3>
        </Link>
        {product.store && (
          <p className="flex items-center gap-1 text-xs text-bark/70">
            <MapPin className="h-3 w-3 text-maple/60" />
            {product.store.name}
          </p>
        )}
        <div className="flex items-end justify-between gap-2 pt-1">
          <p className="text-lg font-extrabold tracking-tight text-foreground">
            {product.price.toLocaleString()}
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">원</span>
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-maple/30 text-maple hover:bg-maple hover:text-white hover:border-maple"
            onClick={(e) => {
              e.preventDefault();
              add(product, 1);
              toast.success(`${product.name} 담았어요`);
            }}
          >
            <Plus className="h-4 w-4" /> 담기
          </Button>
        </div>
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/70 px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
