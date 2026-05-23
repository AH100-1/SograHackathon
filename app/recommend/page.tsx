import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertTriangle, Leaf } from "lucide-react";
import GiftSetCard from "@/components/gift-set-card";
import RecommendLoader from "@/components/recommend-loader";
import { buttonVariants } from "@/components/ui/button";
import type { GiftSet } from "@/types/database";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getRecommendations(params: {
  budget: number;
  target: string;
  occasion: string;
  preference: string;
}): Promise<{ sets: GiftSet[]; error?: string }> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const cookie = h.get("cookie") || "";

  try {
    const res = await fetch(`${base}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify(params),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { sets: [], error: data.error || "unknown" };
    return { sets: data.sets || [] };
  } catch (e: any) {
    return { sets: [], error: e.message };
  }
}

async function Results({
  search,
}: {
  search: {
    budget?: string;
    target?: string;
    occasion?: string;
    preference?: string;
  };
}) {
  const params = {
    budget: Number(search.budget || 30000),
    target: search.target || "부모님",
    occasion: search.occasion || "생일",
    preference: search.preference || "",
  };

  const { sets, error } = await getRecommendations(params);

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-10 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 font-bold text-destructive">
          꿈돌이 추천 중 문제가 발생했습니다.
        </p>
        <p className="mt-1 text-sm text-bark/70">
          ({error}) — Gemini API 키와 시드 데이터를 확인해주세요.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "mt-5 border-maple/40 text-maple",
          })}
        >
          다시 시도
        </Link>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-maple/30 bg-cream/40 p-12 text-center">
        <Leaf className="mx-auto h-10 w-10 text-maple/50" />
        <p className="mt-3 font-bold text-foreground">
          조건에 맞는 한 상을 찾지 못했어요.
        </p>
        <p className="mt-1 text-sm text-bark/70">
          예산을 조금 늘려보거나 다른 취향으로 시도해보세요.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "mt-5 border-maple/40 text-maple",
          })}
        >
          조건 다시 입력
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {sets.map((set, i) => (
        <GiftSetCard key={i} set={set} rank={i + 1} />
      ))}
    </div>
  );
}

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{
    budget?: string;
    target?: string;
    occasion?: string;
    preference?: string;
  }>;
}) {
  const search = await searchParams;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 bg-warm-gradient">
        <Leaf
          aria-hidden
          className="absolute -top-4 -right-6 h-32 w-32 text-maple/10 rotate-12"
        />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-bark/70 hover:text-maple"
          >
            <ArrowLeft className="h-4 w-4" /> 조건 다시 입력
          </Link>

          <div className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-maple-gradient px-3 py-1 text-xs font-bold text-white shadow-maple">
              <Sparkles className="h-3.5 w-3.5" />
              꿈돌이가 골라드린 3가지 한 상
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
              {search.target || "받는 분"}님께 드릴{" "}
              <span className="bg-maple-gradient bg-clip-text text-transparent">
                {search.occasion || "선물"}
              </span>
            </h1>
            <p className="mt-2 text-sm text-bark/75">
              예산{" "}
              <span className="font-bold text-foreground">
                {Number(search.budget || 30000).toLocaleString()}
              </span>
              원
              {search.preference && (
                <>
                  {" · "}
                  <span className="rounded-md bg-accent px-2 py-0.5 text-accent-foreground">
                    &ldquo;{search.preference}&rdquo;
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<RecommendLoader />}>
          <Results search={search} />
        </Suspense>
      </div>
    </div>
  );
}
