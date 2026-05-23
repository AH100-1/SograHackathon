import ProductCard from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">전체 로컬 상품</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        대전충청 소상공인이 직접 등록한 상품 {products.length}개
      </p>
      <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
