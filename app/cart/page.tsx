"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ShoppingBag, ShieldCheck } from "lucide-react";
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
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-bold">장바구니가 비어있어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AI 추천으로 마음에 드는 선물 세트를 찾아보세요.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-6" })}>
          선물 만들러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">장바구니</h1>
      <p className="mt-1 text-sm text-muted-foreground">총 {items.length}종의 상품</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <Card key={product.id} className="flex items-center gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                  className="font-semibold hover:underline line-clamp-1"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {product.store?.name}
                </p>
                <p className="mt-1 font-bold">
                  {(product.price * quantity).toLocaleString()}원
                </p>
              </div>
              <div className="inline-flex items-center rounded-md border">
                <button
                  className="px-2 py-1 hover:bg-muted"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  className="px-2 py-1 hover:bg-muted"
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
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-20">
          <h2 className="font-bold text-lg">결제 정보</h2>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">상품 합계</span>
              <span>{total.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">배송비</span>
              <span className="text-emerald-600 font-medium">무료</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-baseline">
            <span className="font-semibold">최종 결제 금액</span>
            <span className="text-2xl font-extrabold">
              {total.toLocaleString()}원
            </span>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={checkout}
            disabled={placing}
          >
            {placing ? "결제 중…" : "주문하기 (데모)"}
          </Button>

          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            CSRF 토큰으로 보호된 결제 요청
          </div>
        </Card>
      </div>
    </div>
  );
}
