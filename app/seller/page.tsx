import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SellerOnboarding from "@/components/seller-onboarding";
import ProductCreateForm from "@/components/product-create-form";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/seller");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    redirect("/");
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (!stores || stores.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <SellerOnboarding />
      </div>
    );
  }

  const store = stores[0];

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5" /> 셀러 센터
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{store.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{store.address}</p>
        </div>
        <Badge variant="outline">상품 {products?.length || 0}개 등록됨</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Package className="h-4 w-4" /> 내 상품
            </h2>
          </div>

          {!products || products.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              아직 등록한 상품이 없어요. 우측 양식으로 첫 상품을 등록해보세요.
            </Card>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {p.image_url && (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${p.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      재고 {p.stock} · {p.price.toLocaleString()}원
                    </p>
                  </div>
                  <Badge variant={p.is_approved ? "default" : "secondary"}>
                    {p.is_approved ? "판매중" : "승인대기"}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-20">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4" /> 새 상품 등록
          </h3>
          <ProductCreateForm storeId={store.id} />
        </Card>
      </div>
    </div>
  );
}
