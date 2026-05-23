import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Store as StoreIcon, ArrowLeft, ShieldCheck } from "lucide-react";
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

  // UUID 형식 검증 — SQL 인젝션 1차 방어
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
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 전체 상품
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
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
        </div>

        <div className="flex flex-col">
          {p.store && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {p.store.region}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
            {p.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>

          <p className="mt-6 text-3xl font-extrabold">
            {p.price.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground"> 원</span>
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            남은 수량 {p.stock}개
          </p>

          <div className="mt-6">
            <AddToCartButton product={p} />
          </div>

          <Separator className="my-6" />

          {p.description && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground">
                상품 설명
              </h2>
              {/* XSS 방어: DOMPurify로 정제된 HTML만 렌더 */}
              <div
                className="prose prose-sm mt-2 leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }}
              />
            </div>
          )}

          {p.store && (
            <>
              <Separator className="my-6" />
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <StoreIcon className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{p.store.name}</p>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {p.store.category}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.store.address}
                </p>
                {p.store.description && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {p.store.description}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            모든 결제는 7중 보안 정책으로 보호됩니다
          </div>
        </div>
      </div>

      <Separator className="my-12" />

      <ReviewSection productId={id} initialReviews={reviews} />
    </div>
  );
}
