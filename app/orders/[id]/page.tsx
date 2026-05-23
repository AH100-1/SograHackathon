import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold">주문이 완료되었습니다</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          주문번호 #{order.id.slice(0, 8)}
        </p>

        <Separator className="my-6" />

        <div className="text-left space-y-3">
          {order.order_items.map((it: any) => (
            <div key={it.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{it.product?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {it.product?.store?.name} · {it.quantity}개
                </p>
              </div>
              <p className="font-semibold">
                {(it.price_at_purchase * it.quantity).toLocaleString()}원
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="flex items-baseline justify-between">
          <span className="font-semibold">최종 결제 금액</span>
          <span className="text-2xl font-extrabold">
            {order.total_price.toLocaleString()}원
          </span>
        </div>

        <Link
          href="/"
          className={buttonVariants({
            size: "lg",
            className: "mt-6 w-full",
          })}
        >
          홈으로 돌아가기 <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
