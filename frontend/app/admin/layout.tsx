"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader } from "@/components/motion/loader";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: OverviewIcon, role: "viewer" },
  { href: "/admin/contract", label: "Contract", icon: ContractIcon, role: "owner" },
  { href: "/admin/registrar", label: "Registrar", icon: RegistrarIcon, role: "owner" },
  { href: "/admin/repos", label: "Repos", icon: ReposIcon, role: "viewer" },
  { href: "/admin/users", label: "Users", icon: UsersIcon, role: "viewer" },
  { href: "/admin/sponsorship", label: "Sponsorship", icon: SponsorIcon, role: "viewer" },
  { href: "/admin/activity", label: "Activity", icon: ActivityIcon, role: "viewer" },
  { href: "/admin/admins", label: "Admins", icon: AdminsIcon, role: "owner" },
  { href: "/admin/tokens", label: "Tokens", icon: TokensIcon, role: "owner" },
  { href: "/admin/migrate", label: "Migrate", icon: MigrateIcon, role: "owner" },
];

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ContractIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function RegistrarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SponsorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19a9 9 0 1 1 14 0" />
      <line x1="12" y1="13" x2="16" y2="9" />
      <circle cx="12" cy="13" r="1" />
    </svg>
  );
}

function AdminsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function TokensIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M15 9.5c0-1.38-1.34-2.5-3-2.5s-3 1.12-3 2.5 1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5" />
    </svg>
  );
}

function MigrateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/admin/me")
        .then((r) => r.json())
        .then((j) => setAdminRole(j.role || null))
        .catch(() => setAdminRole(null))
        .finally(() => setRoleLoading(false));
    }
  }, [status]);

  if (status === "loading" || roleLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  if (!adminRole) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="serif text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-zinc-600">You don't have admin access. Link an owner or admin wallet to continue.</p>
        <Link href="/dashboard" className="text-sm text-accent hover:underline">Go to dashboard</Link>
      </div>
    );
  }

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.role === "owner") return adminRole === "owner";
    return true;
  });

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
            <span className="serif font-semibold text-sm">Admin</span>
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
          {filteredNav.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
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
        <div className="border-t rule p-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {!collapsed && <span>Back to dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-5 left-4 z-overlay-control">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-[#c1c0b6] border rule rounded-sm"
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-overlay">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-[#c1c0b6] border-r rule">
            <div className="flex items-center justify-between px-4 py-4 border-b rule">
              <span className="serif font-semibold text-sm">Admin</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-zinc-900/5 rounded-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="py-2">
              {filteredNav.map((item) => {
                const active = item.href === "/admin"
                  ? pathname === "/admin"
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
            <div className="border-t rule p-3">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to dashboard</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 px-6 md:px-10 py-8">{children}</div>
    </div>
  );
}
