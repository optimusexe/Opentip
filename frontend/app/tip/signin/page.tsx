import { Suspense } from "react";
import { Loader } from "@/components/motion/loader";
import SignInPageClient from "./SignInPageClient";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader variant="spinner" size={24} /></div>}>
      <SignInPageClient />
    </Suspense>
  );
}
