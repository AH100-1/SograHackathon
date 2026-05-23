import { redirect } from "next/navigation";
import { Leaf, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/admin/admin-tabs";

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
    { data: users },
    { data: stores },
    { data: products },
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
      .from("users")
      .select("id, email, display_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("stores")
      .select("*, owner:users(email, display_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("products")
      .select("*, store:stores(name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("products")
      .select("*, store:stores(name)")
      .eq("is_approved", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

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
            카드를 눌러 사용자·가게·상품·승인 대기 목록을 전환합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <AdminTabs
          counts={{
            users: userCount || 0,
            stores: storeCount || 0,
            products: productCount || 0,
            pending: pendingCount || 0,
          }}
          users={users || []}
          stores={stores || []}
          products={products || []}
          pendingProducts={pendingProducts || []}
        />
      </div>
    </div>
  );
}
