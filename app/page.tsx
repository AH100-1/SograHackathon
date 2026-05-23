import Link from "next/link";
import { Sparkles, Heart, MapPin, ArrowRight, Store } from "lucide-react";
import RecommendForm from "@/components/recommend-form";
import ProductCard from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

export const dynamic = "force-dynamic";

async function getHomeData(): Promise<{ products: Product[]; storeCount: number }> {
  try {
    const supabase = await createClient();
    const [productsRes, storesRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, store:stores(*)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("stores").select("id", { count: "exact", head: true }),
    ]);
    return {
      products: (productsRes.data || []) as Product[],
      storeCount: storesRes.count ?? 0,
    };
  } catch {
    return { products: [], storeCount: 0 };
  }
}

export default async function HomePage() {
  const { products, storeCount } = await getHomeData();

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
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                예산만 알려주세요.
                <br />
                <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  대전 전통시장 한 상
                </span>
                을 AI가 차려드려요.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                카카오 선물하기에 없는 중앙시장 떡집·태평시장 반찬가게·유성5일장 정육점.
                <br className="hidden md:block" />
                대전 전통시장 12곳의 정성을 담아 AI가 한 상을 차려드립니다.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Store className="h-4 w-4 text-primary" />
                  대전 전통시장 12곳
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  로컬 가게 {storeCount > 0 ? `${storeCount}곳` : "준비 중"}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Gemini AI 큐레이션
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
              오늘 시장에서 만난 선물
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              대전 전통시장 가게 사장님들이 직접 차려낸 정성 가득한 상품
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
              아직 등록된 상품이 없습니다.
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
                title: "AI가 차려주는 한 상",
                desc: "예산·받는 분·자리만 알려주세요. Gemini AI가 시장 가게를 조합해 세 가지 차림을 골라드립니다.",
                icon: Sparkles,
              },
              {
                title: "대전 시장의 진짜 정성",
                desc: "중앙시장 떡집·태평시장 반찬가게·유성5일장 정육점까지, 카카오 선물하기엔 없는 한 상.",
                icon: Store,
              },
              {
                title: "받는 분께 바로 발송",
                desc: "주문 즉시 사장님께 전달, 시장에서 갓 차려진 한 상 그대로.",
                icon: Heart,
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
        <p className="mt-1">AI가 차려주는 대전 전통시장 한 상 — 모든 결제는 가상입니다.</p>
      </footer>
    </div>
  );
}
