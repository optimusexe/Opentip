"use client";

import { usePathname } from "next/navigation";
import HeaderShell from "@/components/HeaderShell";
import ConditionalFooter from "@/components/ConditionalFooter";

function isMarketingPath(pathname: string) {
  return pathname === "/" || pathname === "/beta" || pathname.startsWith("/beta/") || pathname === "/terms" || pathname === "/privacy";
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isMarketingPath(pathname)) return <>{children}</>;
  const home = pathname === "/";
  return (
    <>
      <HeaderShell />
      <main id="main-content" className={home ? "flex w-full min-w-0 flex-1 flex-col" : "mx-auto flex w-full min-w-0 max-w-[1120px] flex-1 flex-col px-4 py-8"}>
        {children}
      </main>
      {home ? null : <ConditionalFooter />}
    </>
  );
}
