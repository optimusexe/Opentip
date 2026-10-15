"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import HeaderAuth from "@/components/HeaderAuth";
import NotificationBell from "@/components/NotificationBell";
import { Logo } from "@/components/ledger/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/repos", label: "Repos" },
  { href: "/activity", label: "Activity" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
];

export default function HeaderShell() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const menu = menuRef.current;
    const toggle = toggleRef.current;
    const items = menu ? [...menu.querySelectorAll<HTMLElement>("a[href]")] : [];
    const startY = window.scrollY;
    items[0]?.focus({ preventScroll: true });

    function close() {
      setMobileOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        toggle?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab" || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menu?.contains(target) || toggle?.contains(target)) return;
      close();
    }

    // Page scroll closes the panel. Ignore a same-position scroll (focus)
    // and scrolls inside the panel itself. Do not lock body overflow.
    function onScroll(event: Event) {
      const target = event.target;
      if (target instanceof Node && menu?.contains(target)) return;
      if (window.scrollY === startY) return;
      close();
    }

    function onWheel() {
      close();
    }

    function onTouchMove(event: TouchEvent) {
      const target = event.target;
      if (target instanceof Node && menu?.contains(target)) return;
      close();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
    };
  }, [mobileOpen]);

  const chainLabel = process.env.NEXT_PUBLIC_CHAIN === "base" ? "Base" : "Base Sepolia";

  return (
    <header id="site-header" className="sticky top-0 z-header">
      {/*
        Blur stays on this bar, not the header. backdrop-filter would make a
        fixed descendant position against the bar instead of the viewport.
        The header stays sticky (in flow, so the page does not jump) and the
        panel below is position:fixed so it hangs under the bar at any scroll.
      */}
      <div className="border-b border-border bg-background/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full min-w-0 max-w-[1120px] items-center gap-3 px-4">
          <button
            ref={toggleRef}
            type="button"
            className="p-1 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Opentip home">
            <Logo />
          </Link>
          <div className="ml-4 hidden items-center gap-5 md:flex" aria-label="Primary">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm text-muted-foreground transition-colors hover:text-foreground",
                  pathname === href && "text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Search repositories"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => window.dispatchEvent(new Event("opentip-search"))}
            >
              <Search className="h-4 w-4" />
            </button>
            <span className="hidden items-center rounded-full border border-border px-2.5 py-1 text-xs sm:inline-flex">
              {chainLabel}
            </span>
            <button
              type="button"
              aria-label="Toggle color theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationBell />
            <HeaderAuth />
          </div>
        </nav>
      </div>
      <div
        id={menuId}
        ref={menuRef}
        hidden={!mobileOpen}
        className="fixed inset-x-0 z-header max-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-y-auto border-b border-border bg-background text-foreground md:hidden"
        style={{ top: "calc(4rem + env(safe-area-inset-top, 0px))" }}
      >
        <nav aria-label="Mobile" className="mx-auto w-full max-w-[1120px] px-6 py-4">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block py-2 text-sm text-foreground transition-colors hover:text-accent",
                  active && "font-medium text-accent",
                )}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
