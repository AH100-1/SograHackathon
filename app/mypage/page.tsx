import { redirect } from "next/navigation";
import { Mail, User as UserIcon, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  buyer: "구매자",
  seller: "소상공인",
  admin: "관리자",
};

export default async function MyPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/mypage");

  const { data: profile } = await sb
    .from("users")
    .select("email, display_name, role, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">마이페이지</h1>
      <p className="mt-1 text-sm text-muted-foreground">계정 정보 및 설정</p>

      <div className="mt-8 rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <UserIcon className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">닉네임</p>
            <p className="font-semibold">
              {profile?.display_name || "—"}
            </p>
          </div>
          <Badge variant="outline">{ROLE_LABEL[profile?.role || "buyer"]}</Badge>
        </div>

        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Mail className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">이메일</p>
            <p className="font-medium truncate">{profile?.email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">가입일</p>
            <p className="font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("ko-KR")
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        프로필 편집·비밀번호 변경은 곧 제공될 예정입니다.
      </p>
    </div>
  );
}
