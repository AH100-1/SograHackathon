"use client";

import Link from "next/link";
import {
  Leaf,
  ShoppingBasket,
  User as UserIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store/cart";
import { useEffect, useRef, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";
import type { UserRole } from "@/types/database";

export type NavbarUser = {
  email: string;
  display_name: string | null;
  role: UserRole;
};

export default function Navbar({
  initialUser,
}: {
  initialUser: NavbarUser | null;
}) {
  const count = useCart((s) => s.count());
  const user = initialUser;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_oklab,var(--maple)_22%,transparent)] bg-cream/85 backdrop-blur-md supports-[backdrop-filter]:bg-cream/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-maple-gradient text-white shadow-maple transition-transform group-hover:rotate-[-6deg]">
            <Leaf className="h-5 w-5 drop-shadow-sm" strokeWidth={2.4} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-[18px] tracking-tight text-foreground">
              장터<span className="text-maple">한상</span>
            </span>
            <span className="text-[10px] text-bark/70 -mt-0.5">
              AI가 차려주는 대전 시장 한 상
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
          <NavLink href="/">선물 만들기</NavLink>
          <NavLink href="/products">전체 상품</NavLink>
          {(user?.role === "seller" || user?.role === "admin") && (
            <NavLink href="/seller">셀러 센터</NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink href="/admin" highlight>
              관리자
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="장바구니"
          >
            <ShoppingBasket className="h-5 w-5" />
            {count > 0 && (
              <Badge
                variant="default"
                className="absolute -top-0.5 -right-0.5 h-5 min-w-5 p-0 px-1 text-[10px] shadow-maple"
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
                  className: "gap-2 hover:bg-accent",
                })}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-maple-gradient text-[11px] font-bold text-white">
                  {(user.display_name || user.email)[0].toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate text-foreground">
                  {user.display_name || user.email.split("@")[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-[color-mix(in_oklab,var(--maple)_15%,transparent)] z-50 animate-warm-rise"
                >
                  <div className="px-2.5 py-2 text-xs text-muted-foreground truncate">
                    <p className="font-semibold text-foreground/80">
                      {user.display_name || "장터한상 사용자"}
                    </p>
                    <p className="truncate">{user.email}</p>
                  </div>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <MenuItem
                    href="/mypage"
                    onClick={() => setMenuOpen(false)}
                    icon={<UserIcon className="h-4 w-4" />}
                  >
                    마이페이지 설정
                  </MenuItem>
                  <MenuItem
                    href="/cart"
                    onClick={() => setMenuOpen(false)}
                    icon={<ShoppingBasket className="h-4 w-4" />}
                  >
                    내 장바구니
                  </MenuItem>
                  {(user.role === "seller" || user.role === "admin") && (
                    <MenuItem href="/seller" onClick={() => setMenuOpen(false)}>
                      셀러 센터
                    </MenuItem>
                  )}
                  {user.role === "admin" && (
                    <MenuItem href="/admin" onClick={() => setMenuOpen(false)}>
                      관리자 페이지
                    </MenuItem>
                  )}
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
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
              <Link
                href="/signup"
                className={buttonVariants({
                  size: "sm",
                  className: "bg-maple-gradient text-white hover:opacity-90 shadow-maple",
                })}
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  highlight,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg transition-colors hover:bg-accent ${
        highlight
          ? "text-maple hover:text-maple"
          : "text-foreground/80 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function MenuItem({
  href,
  children,
  onClick,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
