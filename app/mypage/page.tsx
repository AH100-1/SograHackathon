import { redirect } from "next/navigation";
import { Mail, User as UserIcon, ShieldCheck, Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  buyer: "구매자",
  seller: "소상공인",
  admin: "관리자",
};

const ROLE_TONE: Record<string, string> = {
  buyer: "bg-accent text-accent-foreground border-maple/20",
  seller: "bg-maple-gradient text-white border-0 shadow-maple",
  admin: "bg-bark text-cream border-0",
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

  const role = profile?.role || "buyer";
  const initial = (profile?.display_name || profile?.email || "U")[0].toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* 프로필 카드 */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-maple/15 bg-card shadow-maple">
        <div className="h-24 bg-maple-gradient relative">
          <Leaf
            aria-hidden
            className="absolute top-3 right-6 h-16 w-16 text-white/15 rotate-12"
          />
        </div>
        <div className="px-7 pb-7 -mt-10">
          <div className="flex items-end justify-between gap-3">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-cream text-3xl font-black text-maple shadow-maple ring-4 ring-card">
              {initial}
            </span>
            <Badge className={`${ROLE_TONE[role]} px-3 py-1`}>
              {ROLE_LABEL[role]}
            </Badge>
          </div>

          <div className="mt-5">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {profile?.display_name || "장터한상 사용자"}
            </h1>
            <p className="mt-1 text-sm text-bark/70 truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* 정보 리스트 */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <InfoRow
          icon={<UserIcon className="h-4 w-4" />}
          label="닉네임"
          value={profile?.display_name || "—"}
        />
        <div className="h-px bg-border mx-3" />
        <InfoRow
          icon={<Mail className="h-4 w-4" />}
          label="이메일"
          value={profile?.email || "—"}
        />
        <div className="h-px bg-border mx-3" />
        <InfoRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="가입일"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("ko-KR")
              : "—"
          }
        />
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        프로필 편집·비밀번호 변경은 곧 제공될 예정입니다.
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-maple-gradient text-white shadow-sm shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-bark/60">
          {label}
        </p>
        <p className="font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
