"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  Store,
  AlertTriangle,
  MapPin,
  Inbox,
} from "lucide-react";
import ProductApprovalTable from "@/components/admin/product-approval-table";

type TabKey = "users" | "stores" | "products" | "pending";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "buyer" | "seller" | "admin";
  created_at: string;
};

type StoreRow = {
  id: string;
  name: string;
  address: string;
  category: string;
  region?: string | null;
  created_at: string;
  owner?: { email?: string | null; display_name?: string | null } | null;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_approved: boolean;
  created_at: string;
  store?: { name?: string | null } | null;
};

const TABS: {
  key: TabKey;
  label: string;
  icon: typeof Users;
  tone: "maple" | "persimmon" | "mustard" | "destructive";
}[] = [
  { key: "users", label: "전체 사용자", icon: Users, tone: "maple" },
  { key: "stores", label: "등록된 가게", icon: Store, tone: "persimmon" },
  { key: "products", label: "전체 상품", icon: Package, tone: "mustard" },
  {
    key: "pending",
    label: "승인 대기",
    icon: AlertTriangle,
    tone: "destructive",
  },
];

const TONE_CLASS: Record<string, string> = {
  maple: "bg-maple-gradient text-white",
  persimmon: "bg-persimmon text-white",
  mustard: "bg-mustard text-white",
  destructive: "bg-destructive text-destructive-foreground",
};

const ROLE_LABEL: Record<string, string> = {
  buyer: "구매자",
  seller: "소상공인",
  admin: "관리자",
};
const ROLE_BADGE: Record<string, string> = {
  buyer: "bg-accent text-accent-foreground border-0",
  seller: "bg-maple-gradient text-white border-0",
  admin: "bg-bark text-cream border-0",
};

export default function AdminTabs({
  counts,
  users,
  stores,
  products,
  pendingProducts,
}: {
  counts: { users: number; stores: number; products: number; pending: number };
  users: UserRow[];
  stores: StoreRow[];
  products: ProductRow[];
  pendingProducts: any[];
}) {
  const [active, setActive] = useState<TabKey>("pending");

  return (
    <>
      {/* 통계 카드 (버튼) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TABS.map((t) => {
          const value = counts[t.key];
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              aria-pressed={on}
              className={`group text-left rounded-2xl border bg-card p-5 transition-all ${
                on
                  ? "border-maple shadow-maple -translate-y-0.5"
                  : "border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-maple/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-bark/70">
                  {t.label}
                </p>
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${TONE_CLASS[t.tone]}`}
                >
                  <t.icon className="h-4 w-4" />
                </span>
              </div>
              <p
                className={`mt-3 text-3xl font-black tracking-tight ${
                  on ? "text-maple" : "text-foreground"
                }`}
              >
                {value}
              </p>
              {on && (
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-persimmon">
                  ● 보는 중
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* 리스트 헤더 */}
      <div className="mt-10 mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-persimmon">
            {active === "pending"
              ? "Pending Review"
              : active === "users"
              ? "Users"
              : active === "stores"
              ? "Stores"
              : "Products"}
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">
            {TABS.find((t) => t.key === active)?.label}
          </h2>
        </div>
        {active === "pending" && counts.pending > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mustard/20 px-3 py-1 text-xs font-bold text-bark">
            <AlertTriangle className="h-3 w-3" />
            {counts.pending}건 대기 중
          </span>
        )}
      </div>

      {active === "pending" && (
        <ProductApprovalTable initialProducts={pendingProducts} />
      )}
      {active === "users" && <UsersTable rows={users} />}
      {active === "stores" && <StoresTable rows={stores} />}
      {active === "products" && <ProductsTable rows={products} />}
    </>
  );
}

/* ───────── Users ───────── */
function UsersTable({ rows }: { rows: UserRow[] }) {
  if (rows.length === 0) return <EmptyState label="등록된 사용자가 없습니다." />;
  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-xs font-bold uppercase tracking-wider text-bark">
            <tr>
              <th className="px-5 py-3 text-left">닉네임</th>
              <th className="px-5 py-3 text-left">이메일</th>
              <th className="px-5 py-3 text-left">역할</th>
              <th className="px-5 py-3 text-left">가입일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border transition-colors hover:bg-cream/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-maple-gradient text-[11px] font-bold text-white">
                      {(u.display_name || u.email)[0].toUpperCase()}
                    </span>
                    <span className="font-semibold text-foreground">
                      {u.display_name || "—"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-bark/80">{u.email}</td>
                <td className="px-5 py-3">
                  <Badge className={`${ROLE_BADGE[u.role]} px-2.5 py-0.5`}>
                    {ROLE_LABEL[u.role] || u.role}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-bark/70">
                  {new Date(u.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ───────── Stores ───────── */
function StoresTable({ rows }: { rows: StoreRow[] }) {
  if (rows.length === 0) return <EmptyState label="등록된 가게가 없습니다." />;
  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-xs font-bold uppercase tracking-wider text-bark">
            <tr>
              <th className="px-5 py-3 text-left">가게명</th>
              <th className="px-5 py-3 text-left">카테고리</th>
              <th className="px-5 py-3 text-left">주소</th>
              <th className="px-5 py-3 text-left">사장님</th>
              <th className="px-5 py-3 text-left">등록일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.id}
                className="border-t border-border transition-colors hover:bg-cream/40"
              >
                <td className="px-5 py-3 font-bold text-foreground">{s.name}</td>
                <td className="px-5 py-3">
                  <Badge
                    variant="outline"
                    className="border-maple/30 text-maple text-xs font-semibold"
                  >
                    {s.category}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 text-bark/80">
                    <MapPin className="h-3 w-3 text-maple/70" />
                    {s.address}
                  </span>
                </td>
                <td className="px-5 py-3 text-bark/80">
                  {s.owner?.display_name || s.owner?.email || "—"}
                </td>
                <td className="px-5 py-3 text-bark/70">
                  {new Date(s.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ───────── Products ───────── */
function ProductsTable({ rows }: { rows: ProductRow[] }) {
  if (rows.length === 0) return <EmptyState label="등록된 상품이 없습니다." />;
  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-xs font-bold uppercase tracking-wider text-bark">
            <tr>
              <th className="px-5 py-3 text-left">상품명</th>
              <th className="px-5 py-3 text-left">가게</th>
              <th className="px-5 py-3 text-left">가격</th>
              <th className="px-5 py-3 text-left">재고</th>
              <th className="px-5 py-3 text-left">상태</th>
              <th className="px-5 py-3 text-left">등록일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-t border-border transition-colors hover:bg-cream/40"
              >
                <td className="px-5 py-3 font-bold text-foreground">{p.name}</td>
                <td className="px-5 py-3 text-bark/80">
                  {p.store?.name || "—"}
                </td>
                <td className="px-5 py-3 font-bold text-foreground">
                  {p.price.toLocaleString()}원
                </td>
                <td className="px-5 py-3 text-bark/80">{p.stock}</td>
                <td className="px-5 py-3">
                  {p.is_approved ? (
                    <Badge className="bg-maple-gradient text-white border-0">
                      판매중
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-mustard/20 text-bark border border-mustard/30"
                    >
                      승인대기
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-bark/70">
                  {new Date(p.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="rounded-2xl border-dashed border-maple/25 bg-cream/40 p-12 text-center">
      <Inbox className="mx-auto h-10 w-10 text-maple/40" />
      <p className="mt-3 text-sm text-bark/70">{label}</p>
    </Card>
  );
}
