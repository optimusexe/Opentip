"use client";

import { usePathname } from "next/navigation";
import HeaderShell from "@/components/HeaderShell";
import ConditionalFooter from "@/components/ConditionalFooter";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/tip";
  return (
    <>
      <HeaderShell />
      <main
        id="main-content"
        className={home ? "flex w-full min-w-0 flex-1 flex-col" : "mx-auto flex w-full min-w-0 max-w-[1120px] flex-1 flex-col px-4 py-8"}
      >
        {children}
      </main>
      {home ? null : <ConditionalFooter />}
    </>
  );
}
