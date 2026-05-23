"use client";

import Link from "next/link";
import { Gift, ShoppingCart, User as UserIcon, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/csrf-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/types/database";

export default function Navbar() {
  const count = useCart((s) => s.count());
  const [user, setUser] = useState<{
    email: string;
    display_name: string | null;
    role: UserRole;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 서버에서 cookies로 user 검증 — supabase-ssr cookieEncoding 호환성 우회
    fetch("/api/me", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await csrfFetch("/api/auth/logout", { method: "POST" });
    // 풀 페이지 reload로 navbar 포함 모든 상태 초기화
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Gift className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-lg tracking-tight">장터한상</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">
              AI가 차려주는 로컬 선물 패키지
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className="px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            선물 만들기
          </Link>
          <Link
            href="/products"
            className="px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            전체 상품
          </Link>
          {(user?.role === "seller" || user?.role === "admin") && (
            <Link
              href="/seller"
              className="px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              셀러 센터
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded-md hover:bg-muted transition-colors text-primary"
            >
              관리자
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
            aria-label="장바구니"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-5 min-w-5 p-0 px-1 text-[10px]"
              >
                {count}
              </Badge>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "gap-2",
                })}
              >
                <UserIcon className="h-4 w-4" />
                <span className="max-w-[120px] truncate">
                  {user.display_name || user.email.split("@")[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/mypage")}>
                  <UserIcon className="mr-2 h-4 w-4" /> 마이페이지 설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/cart")}>
                  내 장바구니
                </DropdownMenuItem>
                {(user.role === "seller" || user.role === "admin") && (
                  <DropdownMenuItem onClick={() => router.push("/seller")}>
                    셀러 센터
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    관리자 페이지
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                로그인
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
