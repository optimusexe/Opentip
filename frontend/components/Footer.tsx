"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ledger/Logo";

const VISIBLE_PATHS = ["/tip/legal/privacy", "/tip/legal/terms"];

export default function Footer({ force = false }: { force?: boolean }) {
  const pathname = usePathname();
  if (!force && !VISIBLE_PATHS.includes(pathname)) return null;

  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-10 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Tips for open source, from the open market.</p>
        </div>
        <FooterCol title="Product" links={[["Repos", "/tip/repos"], ["Activity", "/tip/activity"], ["Leaderboard", "/tip/leaderboard"], ["Docs", "/tip/docs"]]} />
        <FooterCol
          title="Social"
          links={[
            ["GitHub", "https://github.com/opentiphq"],
            ["X", "https://x.com/opentip_tech"],
            ["support@opentip.tech", "mailto:support@opentip.tech"],
          ]}
        />
        <FooterCol title="Legal" links={[["Terms", "/tip/legal/terms"], ["Privacy", "/tip/legal/privacy"]]} />
      </div>
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-4 pb-8 text-xs text-muted-foreground">
        <p>© 2026 Opentip Tip</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <nav className="flex flex-col gap-2" aria-label={title}>
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      {links.map(([label, href]) =>
        href.startsWith("http") || href.startsWith("mailto:") ? (
          <a key={href} href={href} className="text-sm hover:text-brand" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            {label}
          </a>
        ) : (
          <Link key={href} href={href} className="text-sm hover:text-brand">
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
