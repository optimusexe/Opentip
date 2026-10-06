"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import HeaderAuth from "@/components/HeaderAuth";
import NotificationBell from "@/components/NotificationBell";

const NAV_LINKS = [
  { href: "/repos", label: "Repos" },
  { href: "/activity", label: "Activity" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
];

export default function HeaderShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <header className="border-b rule sticky top-0 bg-[#c1c0b6]/80 backdrop-blur z-header">
        <nav className="w-full px-6 md:px-10 py-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/Opentip.png" alt="Opentip" width={28} height={28} />
              <span className="serif font-semibold text-2xl tracking-tight">Opentip</span>
            </Link>
          </div>
          <div className="hidden md:flex gap-x-8 text-sm items-center text-zinc-700 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative px-3 py-1.5 hover:text-zinc-900 transition-colors before:content-[''] before:absolute before:top-0 before:left-0 before:w-3 before:h-3 before:border-t-[1.5px] before:border-l-[1.5px] before:border-zinc-400 before:-translate-x-1.5 before:-translate-y-1.5 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:border-b-[1.5px] after:border-r-[1.5px] after:border-zinc-400 after:translate-x-1.5 after:translate-y-1.5"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <HeaderAuth />
          </div>
        </nav>
      </header>
      {mobileOpen && (
        <div className="md:hidden border-b rule bg-[#c1c0b6] px-6 py-4 space-y-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block text-sm text-zinc-700 hover:text-zinc-900"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
