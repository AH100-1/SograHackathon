"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { csrfFetch } from "@/lib/csrf-client";
import type { Review } from "@/types/database";
import { toast } from "sonner";

export default function ReviewSection({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isAuthed, setIsAuthed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setIsAuthed(!!data.user));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, content, rating }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "리뷰 등록 실패");
        return;
      }
      setReviews((r) => [data.review, ...r]);
      setContent("");
      setRating(5);
      toast.success("리뷰가 등록되었어요");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight">
        리뷰 <span className="text-muted-foreground">{reviews.length}</span>
      </h2>

      {isAuthed ? (
        <Card className="mt-4 p-5">
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n}점`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="리뷰를 입력하세요 (XSS 공격을 시도해보세요 — DOMPurify로 차단됩니다)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "등록 중…" : "리뷰 등록"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mt-4 p-6 text-center text-sm text-muted-foreground">
          로그인 후 리뷰를 작성할 수 있어요.
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            아직 리뷰가 없습니다. 첫 리뷰를 남겨주세요!
          </p>
        )}
        {reviews.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {r.user?.display_name || "익명"}
              </p>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* XSS 방어: 서버에서 sanitize 후 저장된 HTML 안전하게 렌더 */}
            <div
              className="mt-2 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: r.content }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("ko-KR")}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
