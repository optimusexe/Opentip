"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { GithubIcon } from "@/components/GithubIcon";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "@/components/motion/loader";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Profile", icon: ProfileIcon },
  { href: "/dashboard/repos", label: "Repos", icon: ReposIcon },
  { href: "/dashboard/github-repos", label: "GitHub repos", icon: GithubIcon },
  { href: "/dashboard/wallets", label: "Wallets", icon: WalletIcon },
  { href: "/dashboard/notifications", label: "Notifications", icon: NotificationIcon },
  { href: "/notifications", label: "Recent", icon: NotificationIcon },
  { href: "/dashboard/account", label: "Account", icon: GearIcon },
];

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ReposIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 10H2" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function NotificationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onboardingCheck, setOnboardingCheck] = useState<"pending" | "done">("pending");


  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin?callbackUrl=/dashboard");
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
          router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
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
    <div className="flex min-h-[80vh] fluid-page-neg">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r rule transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-[220px]"
        }`}
      >
        <div className={`flex items-center border-b rule ${collapsed ? "justify-center py-4" : "justify-between px-4 py-4"}`}>
          {!collapsed && (
            <span className="serif font-semibold text-sm">Dashboard</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-zinc-900/5 rounded-sm transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                </>
              )}
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 transition-colors ${
                  collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                } ${
                  active
                    ? "bg-zinc-900/5 text-zinc-900 border-r-2 border-accent"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5"
                }`}
              >
                <item.icon className="shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile hamburger */}
      {!mobileOpen && (
        <div className="md:hidden fixed top-5 left-4 z-overlay-control">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 bg-[#c1c0b6] border rule rounded-sm"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-overlay">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-[#c1c0b6] border-r rule">
            <div className="flex items-center justify-between px-4 py-4 border-b rule">
              <span className="serif font-semibold text-sm">Dashboard</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-zinc-900/5 rounded-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="py-2">
              {NAV_ITEMS.map((item) => {
                const active = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      active
                        ? "bg-zinc-900/5 text-zinc-900 border-r-2 border-accent"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5"
                    }`}
                  >
                    <item.icon className="shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 px-6 md:px-10 py-8">{children}</div>
    </div>
  );
}
