import { Suspense } from "react";
import SignupForm from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
