"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import type { Product } from "@/types/database";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  return (
    <Card className="overflow-hidden border-border/70 transition-all hover:shadow-md p-0 gap-0">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square w-full bg-muted">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          )}
          {product.store?.category && (
            <Badge
              variant="secondary"
              className="absolute left-3 top-3 bg-white/90 backdrop-blur"
            >
              {product.store.category}
            </Badge>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col gap-2">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold leading-snug line-clamp-2 hover:underline">
            {product.name}
          </h3>
        </Link>
        {product.store && (
          <p className="text-xs text-muted-foreground">{product.store.name}</p>
        )}
        <div className="flex items-end justify-between gap-2 pt-1">
          <p className="text-lg font-bold">
            {product.price.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground"> 원</span>
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={(e) => {
              e.preventDefault();
              add(product, 1);
              toast.success(`${product.name} 담았어요`);
            }}
          >
            <Plus className="h-4 w-4" /> 담기
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {product.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] text-accent-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
