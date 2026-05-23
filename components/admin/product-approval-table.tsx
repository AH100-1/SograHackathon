"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";
import { Check, X, Inbox } from "lucide-react";

export default function ProductApprovalTable({
  initialProducts,
}: {
  initialProducts: any[];
}) {
  const [items, setItems] = useState(initialProducts);
  const router = useRouter();

  async function decide(productId: string, approve: boolean) {
    const res = await csrfFetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "실패");
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== productId));
    toast.success(approve ? "승인 완료" : "거부 처리");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-maple/25 bg-cream/40 p-12 text-center">
        <Inbox className="mx-auto h-10 w-10 text-maple/40" />
        <p className="mt-3 text-sm text-bark/70">
          승인 대기중인 상품이 없습니다.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-cream text-xs font-bold uppercase tracking-wider text-bark">
          <tr>
            <th className="px-5 py-3 text-left">상품</th>
            <th className="px-5 py-3 text-left">가게</th>
            <th className="px-5 py-3 text-left">가격</th>
            <th className="px-5 py-3 text-right">처리</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className="border-t border-border transition-colors hover:bg-cream/40"
            >
              <td className="px-5 py-3 font-semibold text-foreground">
                {p.name}
              </td>
              <td className="px-5 py-3 text-bark/75">{p.store?.name}</td>
              <td className="px-5 py-3 font-bold text-foreground">
                {p.price.toLocaleString()}원
              </td>
              <td className="px-5 py-3 text-right space-x-2">
                <Button
                  size="sm"
                  className="bg-maple-gradient text-white shadow-maple hover:opacity-90"
                  onClick={() => decide(p.id, true)}
                >
                  <Check className="h-3.5 w-3.5" /> 승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => decide(p.id, false)}
                >
                  <X className="h-3.5 w-3.5" /> 거부
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
