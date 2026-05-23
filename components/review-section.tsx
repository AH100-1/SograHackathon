"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquareHeart, Pencil } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="h-5 w-5 text-maple" />
        <h2 className="text-xl font-extrabold tracking-tight">
          리뷰{" "}
          <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-maple/10 px-2 text-sm font-bold text-maple">
            {reviews.length}
          </span>
        </h2>
      </div>

      {isAuthed ? (
        <Card className="mt-4 rounded-2xl border-border bg-card p-5 shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n}점`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      n <= rating
                        ? "fill-[var(--mustard)] text-[var(--mustard)]"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-bark/70">
                {rating}.0
              </span>
            </div>
            <Textarea
              placeholder="이 가을, 받은 정성을 한 줄로 남겨주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={3}
              className="rounded-xl"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 bg-maple-gradient text-white shadow-maple hover:opacity-90"
              >
                <Pencil className="h-4 w-4" />
                {submitting ? "등록 중…" : "리뷰 등록"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mt-4 rounded-2xl border-dashed border-maple/30 bg-cream/40 p-6 text-center text-sm text-bark/70">
          로그인 후 리뷰를 작성할 수 있어요.
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground py-10 text-center">
            아직 리뷰가 없습니다. 첫 가을 한 줄을 남겨주세요!
          </p>
        )}
        {reviews.map((r) => (
          <Card
            key={r.id}
            className="rounded-2xl border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-maple-gradient text-xs font-bold text-white">
                  {(r.user?.display_name || "익")[0]}
                </span>
                <p className="text-sm font-bold text-foreground">
                  {r.user?.display_name || "익명"}
                </p>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "fill-[var(--mustard)] text-[var(--mustard)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div
              className="mt-3 text-sm leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ __html: r.content }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("ko-KR")}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
