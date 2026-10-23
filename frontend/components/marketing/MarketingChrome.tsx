import Link from "next/link";

function Mark() {
  return (
    <span className="mkt-logo">
      <i />
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
        <nav className="mkt-links" aria-label="Primary">
          <Link href="/#how">How it works</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <Link className="mkt-tiplink mkt-hidem" href="/tip">
          Opentip Tip
        </Link>
        <Link className="mkt-btn mkt-pri" href="/beta">
          Apply for the beta
        </Link>
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
          <Link className="mkt-btn mkt-pri" href="/beta">
            Apply for the beta
          </Link>
        </div>
        <div className="mkt-col">
          <b>Product</b>
          <Link href="/#how">How it works</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/tip">Opentip Tip</Link>
        </div>
        <div className="mkt-col">
          <b>Social</b>
          <a href="https://x.com/opentip_tech" target="_blank" rel="noreferrer">X @opentip_tech</a>
          <a href="https://github.com/opentiphq" target="_blank" rel="noreferrer">GitHub opentiphq</a>
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
