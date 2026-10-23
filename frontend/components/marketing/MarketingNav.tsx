"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const LINKS = [
  ["/#how", "How it works"],
  ["/#features", "Features"],
  ["/#pricing", "Pricing"],
  ["/#faq", "FAQ"],
  ["/tip", "Opentip Tip"],
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const sheetId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const first = sheetRef.current?.querySelector("a");
    if (first instanceof HTMLElement) first.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mkt-nav">
      <nav className="mkt-links" aria-label="Primary">
        {LINKS.slice(0, 4).map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="mkt-tiplink mkt-hidem" href="/tip">
        Opentip Tip
      </Link>
      <Link className="mkt-btn mkt-pri" href="/beta">
        Apply for the beta
      </Link>
      <button
        ref={buttonRef}
        type="button"
        className="mkt-menu-btn"
        aria-expanded={open}
        aria-controls={sheetId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="mkt-sr">{open ? "Close menu" : "Menu"}</span>
        {open ? (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        )}
      </button>
      {open ? (
        <nav id={sheetId} ref={sheetRef} className="mkt-sheet is-open" aria-label="Menu">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
