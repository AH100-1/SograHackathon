import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Users, Package, Store, AlertTriangle } from "lucide-react";
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
    { data: recentAttempts },
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
    supabase
      .from("login_attempts")
      .select("*")
      .eq("success", false)
      .order("attempted_at", { ascending: false })
      .limit(10),
  ]);

  const stats = [
    { label: "전체 사용자", value: userCount || 0, icon: Users },
    { label: "등록된 가게", value: storeCount || 0, icon: Store },
    { label: "전체 상품", value: productCount || 0, icon: Package },
    { label: "승인 대기", value: pendingCount || 0, icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-5 w-5" />
        <h1 className="text-3xl font-extrabold tracking-tight">관리자 페이지</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        admin 역할만 접근 가능 (RBAC + Supabase RLS 이중 방어)
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-extrabold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Separator className="my-10" />

      <h2 className="text-xl font-bold mb-3">승인 대기 중인 상품</h2>
      <ProductApprovalTable initialProducts={pendingProducts || []} />

      <Separator className="my-10" />

      <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" /> 최근 로그인 실패 기록 (BruteForce 모니터링)
      </h2>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">이메일</th>
              <th className="px-4 py-2 text-left">IP</th>
              <th className="px-4 py-2 text-left">시각</th>
              <th className="px-4 py-2 text-right">결과</th>
            </tr>
          </thead>
          <tbody>
            {(!recentAttempts || recentAttempts.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  최근 실패 기록 없음
                </td>
              </tr>
            )}
            {recentAttempts?.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{a.identifier}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.ip || "—"}</td>
                <td className="px-4 py-2 text-xs">
                  {new Date(a.attempted_at).toLocaleString("ko-KR")}
                </td>
                <td className="px-4 py-2 text-right">
                  <Badge variant="destructive">실패</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
