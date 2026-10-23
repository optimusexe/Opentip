import { Suspense } from "react";
import { Loader } from "@/components/motion/loader";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader variant="spinner" size={24} /></div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
