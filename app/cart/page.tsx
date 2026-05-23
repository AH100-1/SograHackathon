"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ShoppingBasket, Truck, Leaf } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const router = useRouter();
  const [placing, setPlacing] = useState(false);

  async function checkout() {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const res = await csrfFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "주문에 실패했습니다");
        return;
      }
      clear();
      toast.success("주문이 완료되었습니다 (데모 결제)");
      router.push(`/orders/${data.order.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="relative mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-cream shadow-md">
          <ShoppingBasket className="h-9 w-9 text-maple/60" />
          <Leaf
            aria-hidden
            className="absolute -top-2 -right-3 h-7 w-7 text-mustard rotate-12"
          />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">장바구니가 비어있어요</h1>
        <p className="mt-2 text-sm text-bark/70">
          꿈돌이 추천으로 마음에 드는 가을 한 상을 찾아보세요.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            className:
              "mt-6 bg-maple-gradient text-white shadow-maple hover:opacity-90",
          })}
        >
          선물 만들러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-persimmon">
            My Basket
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            장바구니
          </h1>
          <p className="mt-1 text-sm text-bark/70">
            총 <span className="font-bold text-foreground">{items.length}</span>종의
            상품
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <Card
              key={product.id}
              className="flex items-center gap-4 rounded-2xl border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-warm-gradient ring-1 ring-border">
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${product.id}`}
                  className="font-bold text-foreground hover:text-maple line-clamp-1"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-bark/70">{product.store?.name}</p>
                <p className="mt-1 font-extrabold text-foreground">
                  {(product.price * quantity).toLocaleString()}원
                </p>
              </div>
              <div className="inline-flex items-center rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="px-2 py-1.5 text-bark hover:bg-accent transition-colors"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold">
                  {quantity}
                </span>
                <button
                  className="px-2 py-1.5 text-bark hover:bg-accent transition-colors"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(product.id)}
                aria-label="삭제"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        <Card className="h-fit rounded-3xl border-2 border-maple/15 bg-card p-6 shadow-maple lg:sticky lg:top-20">
          <h2 className="font-extrabold text-lg flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-maple-gradient text-white">
              <ShoppingBasket className="h-4 w-4" />
            </span>
            결제 정보
          </h2>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-bark/70">상품 합계</span>
              <span className="font-semibold">{total.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bark/70 flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                배송비
              </span>
              <span className="text-maple font-bold">무료</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-baseline">
            <span className="font-bold">최종 결제 금액</span>
            <span className="text-2xl font-black bg-maple-gradient bg-clip-text text-transparent">
              {total.toLocaleString()}원
            </span>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full bg-maple-gradient text-white shadow-maple hover:opacity-90"
            onClick={checkout}
            disabled={placing}
          >
            {placing ? "결제 중…" : "주문하기 (데모)"}
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            모든 결제는 가상입니다 — SOGRA Hackathon 데모
          </p>
        </Card>
      </div>
    </div>
  );
}
