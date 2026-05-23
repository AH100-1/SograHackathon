import ProductCard from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";
import { Leaf, ShoppingBasket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, store:stores(*)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const products = (data || []) as Product[];

  return (
    <div>
      {/* 가을 헤더 배너 */}
      <section className="relative overflow-hidden border-b border-border/60 bg-warm-gradient">
        <Leaf
          aria-hidden
          className="absolute top-6 right-10 h-24 w-24 text-maple/10 rotate-12"
        />
        <Leaf
          aria-hidden
          className="absolute bottom-2 left-20 h-16 w-16 text-mustard/15 -rotate-12"
        />
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-persimmon">
            Daejeon Local Market
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            대전 전통시장 상품
          </h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-bark/80">
            <ShoppingBasket className="h-4 w-4 text-maple" />
            가게 사장님이 직접 차려낸 상품{" "}
            <span className="font-bold text-foreground">
              {products.length}
            </span>
            개를 골라보세요
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {products.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-maple/25 bg-cream/40 p-16 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록된 상품이 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
