import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export function Mark() {
  return (
    <span className="mkt-logo">
      <img src="/icons/icon-512.png" alt="" width={22} height={22} />
      Opentip
    </span>
  );
}

export function MarketingHeader() {
  return (
    <header>
      <div className="mkt-w mkt-bar">
        <Link href="/" aria-label="Opentip home">
          <Mark />
        </Link>
        <MarketingNav />
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer>
      <div className="mkt-w mkt-foot">
        <div>
          <Mark />
          <p>Docs that write themselves from your code.</p>
        </div>
        <div className="mkt-col">
          <b>Product</b>
          <Link href="/#how">How it works</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/tip">Opentip Tip</Link>
        </div>
        <div className="mkt-col">
          <b>Social</b>
          <a href="https://x.com/opentip_tech" target="_blank" rel="noreferrer">X</a>
          <a href="https://github.com/opentiphq" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="mkt-col">
          <b>Legal</b>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <div className="mkt-copy">© 2026 Opentip</div>
      </div>
    </footer>
  );
}
