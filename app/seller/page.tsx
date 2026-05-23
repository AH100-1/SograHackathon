import { redirect } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/safe-image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, Package, MapPin, Leaf } from "lucide-react";
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
      <div className="mx-auto max-w-2xl px-4 py-14">
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

  const approvedCount = (products || []).filter((p) => p.is_approved).length;
  const pendingCount = (products || []).filter((p) => !p.is_approved).length;

  return (
    <div>
      {/* 셀러 헤더 */}
      <section className="relative overflow-hidden border-b border-border/60 bg-warm-gradient">
        <Leaf
          aria-hidden
          className="absolute top-4 right-12 h-24 w-24 text-maple/10 rotate-12"
        />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-persimmon">
            <Store className="h-3.5 w-3.5" />
            셀러 센터
          </div>
          <div className="mt-2 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                {store.name}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-bark/75">
                <MapPin className="h-3.5 w-3.5 text-maple" />
                {store.address}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-maple/30 bg-card text-bark"
              >
                <Package className="mr-1 h-3 w-3" /> 전체{" "}
                {products?.length || 0}개
              </Badge>
              <Badge className="bg-maple-gradient text-white border-0 shadow-maple">
                판매중 {approvedCount}
              </Badge>
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-mustard/15 text-bark border-0"
                >
                  승인대기 {pendingCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-maple-gradient text-white">
                  <Package className="h-4 w-4" />
                </span>
                내 상품
              </h2>
            </div>

            {!products || products.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-maple/25 bg-cream/40 p-12 text-center text-sm text-bark/70">
                아직 등록한 상품이 없어요. 우측 양식으로 첫 상품을 등록해보세요.
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <Card
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border-border bg-card p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-warm-gradient ring-1 ring-border">
                      <SafeImage
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${p.id}`}
                        className="font-bold text-foreground hover:text-maple line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-bark/70">
                        재고 {p.stock} ·{" "}
                        <span className="font-semibold text-foreground">
                          {p.price.toLocaleString()}원
                        </span>
                      </p>
                    </div>
                    {p.is_approved ? (
                      <Badge className="bg-maple-gradient text-white border-0 shadow-sm">
                        판매중
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-mustard/20 text-bark border border-mustard/30"
                      >
                        승인대기
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="h-fit rounded-3xl border-2 border-maple/15 bg-card p-6 shadow-maple lg:sticky lg:top-20">
            <h3 className="font-extrabold flex items-center gap-2 mb-4 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-maple-gradient text-white">
                <Plus className="h-4 w-4" />
              </span>
              새 상품 등록
            </h3>
            <ProductCreateForm storeId={store.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
