import { Suspense } from "react";
import LoginForm from "@/components/login-form";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative overflow-hidden">
      {/* 가을 배경 데코 */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-hero-autumn" />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute top-12 left-12 h-10 w-10 text-maple/15 rotate-12"
      />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute bottom-16 right-20 h-14 w-14 text-mustard/15 -rotate-12"
      />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-10 h-6 w-6 text-persimmon/20 rotate-45"
      />

      <div className="mx-auto max-w-md px-4 py-20">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
