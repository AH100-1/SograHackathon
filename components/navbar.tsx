"use client";

import Link from "next/link";
import { Gift, ShoppingCart, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store/cart";
import { useEffect, useRef, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";
import type { UserRole } from "@/types/database";

export default function Navbar() {
  const count = useCart((s) => s.count());
  const [user, setUser] = useState<{
    email: string;
    display_name: string | null;
    role: UserRole;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function logout() {
    await csrfFetch("/api/auth/logout", { method: "POST" });
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
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
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
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 z-50"
                >
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <Link
                    href="/mypage"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <UserIcon className="h-4 w-4" /> 마이페이지 설정
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    내 장바구니
                  </Link>
                  {(user.role === "seller" || user.role === "admin") && (
                    <Link
                      href="/seller"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      셀러 센터
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> 로그아웃
                  </button>
                </div>
              )}
            </div>
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
