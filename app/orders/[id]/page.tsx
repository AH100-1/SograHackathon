import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ArrowRight, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*, store:stores(*)))")
    .eq("id", id)
    .eq("buyer_id", user.id)
    .single();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card className="relative overflow-hidden rounded-3xl border-2 border-maple/20 bg-card p-10 text-center shadow-maple-lg">
        <Leaf
          aria-hidden
          className="absolute -top-4 -right-4 h-24 w-24 text-maple/10 rotate-12"
        />
        <Leaf
          aria-hidden
          className="absolute -bottom-5 -left-3 h-20 w-20 text-mustard/15 -rotate-12"
        />

        <div className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-maple-gradient text-white shadow-maple">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
          주문이 완료되었습니다
        </h1>
        <p className="mt-1 text-sm text-bark/70">
          주문번호{" "}
          <span className="font-mono font-bold text-foreground">
            #{order.id.slice(0, 8)}
          </span>
        </p>

        <Separator className="my-7" />

        <div className="text-left space-y-3">
          {order.order_items.map((it: any) => (
            <div
              key={it.id}
              className="flex items-center justify-between rounded-xl bg-cream/50 p-3 text-sm"
            >
              <div>
                <p className="font-bold text-foreground">{it.product?.name}</p>
                <p className="text-xs text-bark/70">
                  {it.product?.store?.name} · {it.quantity}개
                </p>
              </div>
              <p className="font-extrabold text-foreground">
                {(it.price_at_purchase * it.quantity).toLocaleString()}원
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-7" />

        <div className="flex items-baseline justify-between">
          <span className="font-bold text-bark">최종 결제 금액</span>
          <span className="text-3xl font-black bg-maple-gradient bg-clip-text text-transparent">
            {order.total_price.toLocaleString()}원
          </span>
        </div>

        <Link
          href="/"
          className={buttonVariants({
            size: "lg",
            className:
              "mt-7 w-full gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90",
          })}
        >
          홈으로 돌아가기 <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
