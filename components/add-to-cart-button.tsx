"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBasket } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import type { Product } from "@/types/database";
import { toast } from "sonner";

export default function AddToCartButton({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          aria-label="감소"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-bark hover:bg-accent transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center font-bold text-foreground">{qty}</span>
        <button
          type="button"
          aria-label="증가"
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="px-3 py-2 text-bark hover:bg-accent transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button
        size="lg"
        className="flex-1 gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90 hover:shadow-maple-lg"
        onClick={() => {
          add(product, qty);
          toast.success(`${product.name} ${qty}개 담았어요`);
        }}
      >
        <ShoppingBasket className="h-4 w-4" />
        장바구니에 담기
      </Button>
    </div>
  );
}
