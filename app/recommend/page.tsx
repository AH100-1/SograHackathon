import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import GiftSetCard from "@/components/gift-set-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  try {
    const res = await fetch(`${base}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-semibold text-destructive">
          AI 추천 중 문제가 발생했습니다.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ({error}) — Anthropic API 키와 시드 데이터를 확인해주세요.
        </p>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "mt-4" })}
        >
          다시 시도
        </Link>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/30 p-8 text-center">
        <p className="font-semibold">조건에 맞는 세트를 찾지 못했어요.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          예산을 조금 늘려보거나 다른 취향으로 시도해보세요.
        </p>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "mt-4" })}
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

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 조건 다시 입력
      </Link>

      <div className="mt-4 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI가 골라드린 3가지 세트
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          {search.target || "받는 분"}님께 드릴{" "}
          <span className="text-primary">{search.occasion || "선물"}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          예산 {Number(search.budget || 30000).toLocaleString()}원
          {search.preference && ` · "${search.preference}"`}
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <Results search={search} />
      </Suspense>
    </div>
  );
}
