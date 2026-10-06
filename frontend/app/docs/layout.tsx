"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const SECTIONS = [
  { href: "/docs", label: "Overview", exact: true },
  { href: "/docs/getting-started", label: "Getting Started" },
  { href: "/docs/smart-wallet", label: "Smart Wallet" },
  { href: "/docs/for-developers", label: "For Developers" },
  { href: "/docs/smart-contract", label: "Smart Contract" },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "/docs/contributing", label: "Contributing" },
  { href: "/docs/troubleshooting", label: "Troubleshooting" },
  { href: "/docs/resources", label: "Resources" },
  { href: "/docs/contacts", label: "Contact" },
];

function getActiveLabel(pathname: string) {
  for (const s of SECTIONS) {
    if (s.exact ? pathname === s.href : pathname.startsWith(s.href)) return s.label;
  }
  return "Overview";
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {SECTIONS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`block px-3 py-2 text-sm rounded-sm transition-colors ${
              active
                ? "bg-accent/10 text-accent font-medium"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = getActiveLabel(pathname);

  return (
    <div className="py-4">
      {/* Mobile nav */}
      <div className="lg:hidden sticky top-[73px] z-sticky bg-[#c1c0b6] fluid-page-neg fluid-page pb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 border rule rounded-sm text-sm font-medium"
        >
          <span>{activeLabel}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && (
          <div className="mt-2 border rule rounded-sm bg-[#c1c0b6] p-2 space-y-0.5">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="flex gap-16 mt-8">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <nav className="sticky top-28 z-sticky space-y-1">
            <NavLinks />
          </nav>
        </aside>
        <div className="flex-1 min-w-0 max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
