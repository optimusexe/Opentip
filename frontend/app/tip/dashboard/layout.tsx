"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/motion/loader";

const NAV_ITEMS = [
  { href: "/tip/dashboard", label: "Profile" },
  { href: "/tip/dashboard/repos", label: "Repos" },
  { href: "/tip/dashboard/github-repos", label: "GitHub repos" },
  { href: "/tip/dashboard/wallets", label: "Wallets" },
  { href: "/tip/dashboard/notifications", label: "Notifications" },
  { href: "/tip/notifications", label: "Recent" },
  { href: "/tip/dashboard/account", label: "Account" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [onboardingCheck, setOnboardingCheck] = useState<"pending" | "done">("pending");


  useEffect(() => {
    if (status === "unauthenticated") router.replace("/tip/signin?callbackUrl=/tip/dashboard");
  }, [status]);

  // Fresh accounts (e.g. GitHub signups) land here before onboarding —
  // bounce them into the funnel instead of a dead-end dashboard.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/account/status")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j?.onboardingComplete) {
          router.replace(`/tip/onboarding?next=${encodeURIComponent(pathname)}`);
        } else {
          setOnboardingCheck("done");
        }
      })
      .catch(() => {
        if (!cancelled) setOnboardingCheck("done");
      });
    return () => {
      cancelled = true;
    };
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  // Hold the dashboard behind a spinner while the onboarding check runs —
  // avoids flashing dashboard content right before the bounce.
  if (onboardingCheck !== "done") {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/tip/dashboard"
            ? pathname === "/tip/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
