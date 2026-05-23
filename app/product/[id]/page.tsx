import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Store as StoreIcon, ArrowLeft, Package, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/security/sanitize";
import AddToCartButton from "@/components/add-to-cart-button";
import ReviewSection from "@/components/review-section";
import type { Product, Review } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, store:stores(*)")
    .eq("id", id)
    .eq("is_approved", true)
    .single();

  if (!product) notFound();

  const p = product as Product;

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, user:users(display_name)")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviews = (reviewsData || []) as Review[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-bark/70 hover:text-maple"
      >
        <ArrowLeft className="h-4 w-4" /> 전체 상품
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* ── 이미지 ── */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-warm-gradient shadow-md">
          {p.image_url && (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
          <Leaf
            aria-hidden
            className="absolute top-4 left-4 h-6 w-6 text-white/80 drop-shadow"
          />
        </div>

        {/* ── 정보 ── */}
        <div className="flex flex-col">
          {p.store && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-persimmon">
              <MapPin className="h-3.5 w-3.5" />
              {p.store.region}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
            {p.name}
          </h1>

          {p.tags && p.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-accent text-accent-foreground border-0"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-maple/15 bg-cream/60 p-5">
            <p className="text-3xl font-black tracking-tight text-foreground">
              {p.price.toLocaleString()}
              <span className="text-base font-medium text-muted-foreground">
                {" "}
                원
              </span>
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-bark/75">
              <Package className="h-3.5 w-3.5 text-maple" />
              남은 수량 <span className="font-bold text-foreground">{p.stock}</span>개
            </p>
            <div className="mt-5">
              <AddToCartButton product={p} />
            </div>
          </div>

          {p.description && (
            <div className="mt-7">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-persimmon">
                상품 설명
              </h2>
              <div
                className="prose prose-sm mt-2 leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }}
              />
            </div>
          )}

          {p.store && (
            <div className="mt-7 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-maple-gradient text-white shadow-maple">
                  <StoreIcon className="h-4 w-4" />
                </span>
                <p className="font-bold text-foreground">{p.store.name}</p>
                <Badge
                  variant="outline"
                  className="ml-auto border-maple/30 text-maple text-xs font-semibold"
                >
                  {p.store.category}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-bark/75 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {p.store.address}
              </p>
              {p.store.description && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                  {p.store.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-12" />

      <ReviewSection productId={id} initialReviews={reviews} />
    </div>
  );
}
