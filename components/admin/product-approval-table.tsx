"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/csrf-client";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

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
      <Card className="p-8 text-center text-sm text-muted-foreground">
        승인 대기중인 상품이 없습니다.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">상품</th>
            <th className="px-4 py-2 text-left">가게</th>
            <th className="px-4 py-2 text-left">가격</th>
            <th className="px-4 py-2 text-right">처리</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-2 font-medium">{p.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{p.store?.name}</td>
              <td className="px-4 py-2">{p.price.toLocaleString()}원</td>
              <td className="px-4 py-2 text-right space-x-2">
                <Button size="sm" onClick={() => decide(p.id, true)}>
                  <Check className="h-3.5 w-3.5" /> 승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
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
