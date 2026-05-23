import Link from "next/link";
import { Sparkles, ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import RecommendForm from "@/components/recommend-form";
import ProductCard from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

export const dynamic = "force-dynamic";

async function getPopularProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, store:stores(*)")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(8);
    return (data || []) as Product[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getPopularProducts();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50 via-rose-50/40 to-background"
        />
        <div
          aria-hidden
          className="absolute -top-24 -left-24 -z-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-24 -z-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <div className="grid gap-10 md:grid-cols-[1.05fr_1fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                AI 큐레이션 베타 · 대전충청 한정
              </div>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                예산만 알려주세요.
                <br />
                <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  마음 담은 선물
                </span>
                은 AI가 골라요.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                카카오 선물하기에 없는 동네 수제품·로컬 특산물.
                <br className="hidden md:block" />
                대전충청 소상공인의 정성을 담아 AI가 선물 세트를 구성해드립니다.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> 10개 로컬 가게
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Claude AI 큐레이션
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> 7중 보안
                </div>
              </div>
            </div>

            <div className="md:pl-4">
              <RecommendForm />
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              지금 인기있는 로컬 선물
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              대전충청 소상공인이 직접 만든 정성 가득한 상품들
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            전체보기 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록된 상품이 없습니다. <br />
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                supabase/seed.sql
              </code>{" "}
              을 적용해 데모 데이터를 채워주세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* WHY US */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-center">
            왜 &quot;장터한상&quot; 일까요?
          </h2>
          <div className="grid gap-6 md:grid-cols-3 mt-10">
            {[
              {
                title: "AI가 골라주는 선물",
                desc: "예산·대상·취향만 입력하면 Claude AI가 세 가지 세트를 큐레이션합니다.",
                icon: Sparkles,
              },
              {
                title: "로컬에만 있는 진짜 정성",
                desc: "카카오 선물하기엔 없는 대전충청 소상공인의 수제품 컬렉션.",
                icon: MapPin,
              },
              {
                title: "안심하고 결제",
                desc: "XSS·CSRF·SQLi 등 7대 보안 표준을 모두 적용했습니다.",
                icon: ShieldCheck,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <p>SOGRA Hackathon 2026 · ARGOS · 충남대학교</p>
        <p className="mt-1">로컬 선물 오마카세 데모 — 모든 결제는 가상입니다.</p>
      </footer>
    </div>
  );
}
