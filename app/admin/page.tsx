import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Users, Package, Store, AlertTriangle, Leaf, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductApprovalTable from "@/components/admin/product-approval-table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const [
    { count: userCount },
    { count: storeCount },
    { count: productCount },
    { count: pendingCount },
    { data: pendingProducts },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false),
    supabase
      .from("products")
      .select("*, store:stores(name)")
      .eq("is_approved", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const stats = [
    {
      label: "전체 사용자",
      value: userCount || 0,
      icon: Users,
      tone: "maple",
    },
    {
      label: "등록된 가게",
      value: storeCount || 0,
      icon: Store,
      tone: "persimmon",
    },
    {
      label: "전체 상품",
      value: productCount || 0,
      icon: Package,
      tone: "mustard",
    },
    {
      label: "승인 대기",
      value: pendingCount || 0,
      icon: AlertTriangle,
      tone: "destructive",
    },
  ] as const;

  const toneClass: Record<string, string> = {
    maple: "bg-maple-gradient text-white",
    persimmon: "bg-persimmon text-white",
    mustard: "bg-mustard text-white",
    destructive: "bg-destructive text-destructive-foreground",
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 bg-warm-gradient">
        <Leaf
          aria-hidden
          className="absolute top-4 right-12 h-24 w-24 text-maple/10 rotate-12"
        />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-persimmon">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Console
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            관리자 페이지
          </h1>
          <p className="mt-2 text-sm text-bark/75">
            승인 대기 상품을 검토하고 노출 여부를 결정합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card
              key={s.label}
              className="rounded-2xl border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-bark/70">
                  {s.label}
                </p>
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneClass[s.tone]} shadow-sm`}
                >
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-persimmon">
              Pending Review
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">
              승인 대기 중인 상품
            </h2>
          </div>
          {pendingCount && pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mustard/20 px-3 py-1 text-xs font-bold text-bark">
              <AlertTriangle className="h-3 w-3" />
              {pendingCount}건 대기 중
            </span>
          ) : null}
        </div>
        <ProductApprovalTable initialProducts={pendingProducts || []} />
      </div>
    </div>
  );
}
