import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Navbar, { type NavbarUser } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "장터한상 — 꿈돌이가 차려주는 대전 전통시장 한 상",
  description:
    "예산만 알려주세요. 꿈돌이가 대전 전통시장 소상공인 상품으로 마음을 담은 한 상을 차려드립니다.",
};

async function getCurrentUser(): Promise<NavbarUser | null> {
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    const { data: profile } = await sb
      .from("users")
      .select("email, display_name, role")
      .eq("id", user.id)
      .single();
    if (!profile) return null;
    return {
      email: profile.email,
      display_name: profile.display_name,
      role: profile.role,
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar initialUser={user} />
        <main className="flex-1">{children}</main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
