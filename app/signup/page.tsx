import { Suspense } from "react";
import SignupForm from "@/components/signup-form";
import { Leaf } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-hero-autumn" />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute top-16 right-12 h-10 w-10 text-maple/15 rotate-12"
      />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute bottom-12 left-16 h-14 w-14 text-mustard/15 -rotate-12"
      />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-8 h-6 w-6 text-persimmon/20 rotate-45"
      />

      <div className="mx-auto max-w-md px-4 py-20">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
