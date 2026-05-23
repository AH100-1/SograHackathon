import Link from "next/link";
import {
  Sparkles,
  Heart,
  MapPin,
  ArrowRight,
  Store,
  Leaf,
  Soup,
  ShieldCheck,
} from "lucide-react";
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
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative overflow-hidden">
        {/* 따뜻한 그라데이션 */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-hero-autumn" />

        {/* 떨어지는 단풍잎 데코 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <Leaf
            className="absolute top-[-2%] left-[12%] h-7 w-7 text-maple/40 animate-leaf-fall"
            style={{ animationDelay: "0s" }}
          />
          <Leaf
            className="absolute top-[-2%] left-[28%] h-5 w-5 text-persimmon/40 animate-leaf-fall"
            style={{ animationDelay: "3s" }}
          />
          <Leaf
            className="absolute top-[-2%] left-[68%] h-6 w-6 text-mustard/50 animate-leaf-fall"
            style={{ animationDelay: "6s" }}
          />
          <Leaf
            className="absolute top-[-2%] left-[85%] h-4 w-4 text-maple/30 animate-leaf-fall"
            style={{ animationDelay: "9s" }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 pt-16 pb-16 md:pt-24 md:pb-20">
          <div className="grid gap-12 md:grid-cols-[1.05fr_1fr] md:items-center">
            <div className="animate-warm-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-maple/30 bg-white/70 px-3 py-1 text-xs font-semibold text-maple shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                AI가 차려주는 가을 한 상
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight md:text-[56px]">
                예산만 알려주세요.
                <br />
                <span className="bg-maple-gradient bg-clip-text text-transparent">
                  대전 전통시장 한 상
                </span>
                <br />
                <span className="text-foreground">AI가 차려드려요.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-bark/80 md:text-lg">
                카카오 선물하기엔 없는 중앙시장 떡집·태평시장 반찬가게·유성5일장
                정육점. <br className="hidden md:block" />
                대전 전통시장 12곳의 가을 정성을 담아 AI가 한 상을 차려드립니다.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
                <Pill icon={<Store className="h-4 w-4" />} label="대전 전통시장 12곳" />
                <Pill
                  icon={<MapPin className="h-4 w-4" />}
                  label={storeCount > 0 ? `로컬 가게 ${storeCount}곳` : "로컬 가게 준비 중"}
                />
                <Pill icon={<Sparkles className="h-4 w-4" />} label="Gemini AI 큐레이션" />
              </div>
            </div>

            <div className="md:pl-2">
              <RecommendForm />
            </div>
          </div>
        </div>

        {/* 하단 물결(잎사귀) 라인 */}
        <svg
          aria-hidden
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="absolute bottom-[-1px] left-0 w-full h-10 text-cream"
          fill="currentColor"
        >
          <path d="M0,40 C240,80 480,0 720,30 C960,60 1200,10 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* ─────────────── POPULAR ─────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-persimmon">
              Today&apos;s Pick
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              오늘 시장에서 만난 선물
            </h2>
            <p className="text-sm text-bark/70 mt-2">
              대전 전통시장 가게 사장님들이 직접 차려낸 정성 가득한 가을 상품
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-maple hover:underline inline-flex items-center gap-1 group"
          >
            전체보기
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-maple/25 bg-cream/60 p-14 text-center">
            <Soup className="mx-auto h-10 w-10 text-maple/50" />
            <p className="mt-3 text-sm text-muted-foreground">
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

      {/* ─────────────── WHY US ─────────────── */}
      <section className="relative border-t border-border/60 bg-warm-gradient">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-persimmon">
              Why JangteoHansang
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
              왜 <span className="text-maple">&ldquo;장터한상&rdquo;</span>일까요?
            </h2>
            <p className="mt-3 text-sm text-bark/70 md:text-base">
              대전 전통시장의 가을 정성을, AI가 한 상으로 차려드립니다.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-12">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-3xl border border-border/70 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-maple ${
                    i === 0
                      ? "bg-maple-gradient"
                      : i === 1
                      ? "bg-persimmon"
                      : "bg-mustard"
                  }`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-extrabold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-bark/75 leading-relaxed">
                  {f.desc}
                </p>
                <span className="absolute right-5 top-5 text-5xl font-black text-maple/10 leading-none select-none">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* 보안/신뢰 미니 배너 */}
          <div className="mt-12 grid sm:grid-cols-3 gap-3 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
            <TrustBadge icon={<ShieldCheck className="h-4 w-4" />} label="안전 결제 · 가상결제 데모" />
            <TrustBadge icon={<MapPin className="h-4 w-4" />} label="대전 충청 로컬 큐레이션" />
            <TrustBadge icon={<Heart className="h-4 w-4" />} label="소상공인 정성 직배송" />
          </div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-maple-gradient px-8 py-14 text-white shadow-maple-lg md:px-14">
            <Leaf
              aria-hidden
              className="absolute -top-6 -right-6 h-40 w-40 text-white/10 rotate-12"
            />
            <Leaf
              aria-hidden
              className="absolute -bottom-10 left-10 h-28 w-28 text-white/10 -rotate-12"
            />
            <h2 className="text-3xl font-extrabold leading-snug md:text-4xl">
              올 가을, 한 상 가득한 마음을 전해보세요.
            </h2>
            <p className="mt-4 max-w-xl text-white/90 text-sm md:text-base">
              생일·명절·감사 인사까지. 받는 사람의 자리만 알려주시면 AI가 한 상
              세 가지를 차려드립니다.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-maple shadow hover:bg-cream"
              >
                상품 둘러보기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
              >
                지금 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center gap-2 text-bark">
            <Leaf className="h-4 w-4 text-maple" />
            <span className="text-sm font-bold">장터한상</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            SOGRA Hackathon 2026 · ARGOS · 충남대학교
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AI가 차려주는 대전 전통시장 한 상 — 모든 결제는 가상입니다.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
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
];

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-bark backdrop-blur ring-1 ring-border">
      <span className="text-maple">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-bark">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </span>
      {label}
    </div>
  );
}
