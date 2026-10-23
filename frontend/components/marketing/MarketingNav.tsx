"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const LINKS = [
  ["/#how", "How it works"],
  ["/#features", "Features"],
  ["/#pricing", "Pricing"],
  ["/#faq", "FAQ"],
  ["/tip", "Opentip Tip"],
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const sheetId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const items = [...sheetRef.current.querySelectorAll("a")];
      const first = items[0];
      const last = items[items.length - 1];
      if (!(first instanceof HTMLElement) || !(last instanceof HTMLElement)) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const first = sheetRef.current?.querySelector("a");
    if (first instanceof HTMLElement) first.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }

  const overlay =
    open && mounted
      ? createPortal(
          <div className="mkt-overlay">
            <button type="button" className="mkt-scrim" aria-label="Close menu" onClick={() => close(true)} />
            <nav id={sheetId} ref={sheetRef} className="mkt-sheet" aria-label="Menu">
              {LINKS.map(([href, label]) => (
                <Link key={href} className="mkt-sheet-link" href={href} onClick={() => close(false)}>
                  {label}
                </Link>
              ))}
              <Link className="mkt-btn mkt-pri mkt-sheet-cta" href="/beta" onClick={() => close(false)}>
                Apply for the beta
              </Link>
            </nav>
          </div>,
          document.body,
        )
      : null;

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
      <Link className="mkt-btn mkt-sm mkt-pri mkt-hidem" href="/beta">
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
      {overlay}
    </div>
  );
}
