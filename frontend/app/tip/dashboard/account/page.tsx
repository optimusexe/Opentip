import { Suspense } from "react";
import { Loader } from "@/components/motion/loader";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader variant="spinner" size={24} /></div>}>
      <AccountClient />
    </Suspense>
  );
}
